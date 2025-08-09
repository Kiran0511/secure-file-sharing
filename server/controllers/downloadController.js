const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { otpStore } = require("../utils/otpUtil");
const { decryptAESKeyWithRSA } = require("../utils/rsaUtil");
const { decryptFile } = require("../utils/aesUtil");
const supabase = require("../supabase/supabaseClient");
const { GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../cloud/awsConfig");
const { cleanupUnusedKeys, forceCleanupOldKeys } = require("../utils/keyCleanup");
const AuditLogger = require("../utils/auditLogger");

exports.serveDownloadPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../views", "download.html"));
};

exports.verifyAndDownload = async (req, res) => {
  const { token, otp } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  let decoded;
  let storageToken;
  let recipientEmail = 'unknown';

  try {
    // Try to decode the JWT to get file information
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    storageToken = decoded.storageToken;
  } catch (jwtError) {
    // If JWT verification fails, try to extract storage token from the token itself
    // This handles cases where token might be expired but we still want to check file status
    try {
      const payload = jwt.decode(token);
      if (payload && payload.storageToken) {
        storageToken = payload.storageToken;
        console.log("JWT expired but extracted storageToken for status check");
      } else {
        console.error("❌ JWT verification failed and no storageToken found:", jwtError.message);
        return res.status(401).json({ 
          success: false, 
          message: "Invalid access token format" 
        });
      }
    } catch (decodeError) {
      console.error("❌ JWT decode failed:", decodeError.message);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid access token" 
      });
    }
  }

    // Check file status first (this works even if JWT is expired but decodable)
    if (storageToken) {
      try {
        const { data: fileShare, error: statusError } = await supabase
          .from("file_shares")
          .select("status, sender_email, recipient_email, file_name")
          .eq("storage_token", storageToken)
          .single();

        if (!statusError && fileShare) {
          recipientEmail = fileShare.recipient_email || 'unknown';
          
          // Check if file is already downloaded or revoked BEFORE any other validation
          if (fileShare.status === "Downloaded") {
            // Audit log for attempted download of already downloaded file
            await AuditLogger.logFileDownload(
              recipientEmail,
              fileShare.file_name,
              false,
              ipAddress,
              userAgent,
              storageToken,
              { reason: 'already_downloaded' }
            );
            
            return res.status(410).json({ 
              success: false, 
              message: "File has already been downloaded. Please contact the sender if you need the file again." 
            });
          }

          if (fileShare.status === "Revoked") {
            // Audit log for attempted download of revoked file
            await AuditLogger.logFileDownload(
              recipientEmail,
              fileShare.file_name,
              false,
              ipAddress,
              userAgent,
              storageToken,
              { reason: 'file_revoked' }
            );
            
            return res.status(410).json({ 
              success: false, 
              message: "File has been revoked by the sender. Please contact the sender for more information." 
            });
          }

          if (fileShare.status === "Expired") {
            // Audit log for attempted download of expired file
            await AuditLogger.logFileDownload(
              recipientEmail,
              fileShare.file_name,
              false,
              ipAddress,
              userAgent,
              storageToken,
              { reason: 'file_expired' }
            );
            
            return res.status(410).json({ 
              success: false, 
              message: "File has expired. Please contact the sender to request a new file share." 
            });
          }

          if (fileShare.status !== "Pending") {
            return res.status(400).json({ 
              success: false, 
              message: "File is not available for download." 
            });
          }
        }
      } catch (dbError) {
        console.error("❌ Database error during status check:", dbError.message);
      }
    }  // If we reach here and don't have a valid decoded token, return JWT error
  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired access token" 
    });
  }

  try {
    const { filename, encryptedAESKey, iv, keyVersion } = decoded;

    // Final file status check with full error handling
    const { data: fileShare, error: statusError } = await supabase
      .from("file_shares")
      .select("status, sender_email")
      .eq("storage_token", storageToken)
      .single();

    if (statusError) {
      console.error("❌ Error checking file status:", statusError.message);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to verify file status." 
      });
    }

    if (!fileShare) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found." 
      });
    }

    // Final status check (redundant but ensures consistency)
    if (fileShare.status !== "Pending") {
      return res.status(400).json({ 
        success: false, 
        message: "File is not available for download." 
      });
    }

    // Now check OTP only if everything else is valid
    const record = otpStore.get(token);
    if (!record || Date.now() > record.expiresAt || record.otp !== otp) {
      // Audit log for failed OTP verification
      await AuditLogger.logOTPVerification(
        recipientEmail,
        false,
        ipAddress,
        userAgent,
        storageToken,
        { reason: !record ? 'no_record' : (Date.now() > record.expiresAt ? 'expired' : 'invalid_otp') }
      );
      
      return res.status(403).json({ 
        success: false, 
        message: "Invalid or expired OTP" 
      });
    }

    // Audit log for successful OTP verification
    await AuditLogger.logOTPVerification(
      recipientEmail,
      true,
      ipAddress,
      userAgent,
      storageToken
    );

    // Continue with download process
    const aesKey = decryptAESKeyWithRSA(Buffer.from(encryptedAESKey, "base64"), keyVersion);
    const decryptedFileName = filename.replace(".enc", "");
    const s3Key = `uploads/${filename}`;
    let encryptedData;

    // Download encrypted file from S3
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        })
      );
      encryptedData = await streamToBuffer(s3Response.Body);
    } catch (err) {
      console.error("❌ Failed to download from S3:", err.message);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to download file from cloud." 
      });
    }

    const decryptedBuffer = decryptFile(encryptedData, aesKey, Buffer.from(iv, "base64"));

    res.setHeader("Content-Disposition", `attachment; filename=${decryptedFileName}`);
    const ext = path.extname(decryptedFileName).toLowerCase();
    if (ext === ".pdf") {
      res.setHeader("Content-Type", "application/pdf");
    } else if (ext === ".jpg" || ext === ".jpeg") {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (ext === ".png") {
      res.setHeader("Content-Type", "image/png");
    } else if (ext === ".mp4") {
      res.setHeader("Content-Type", "video/mp4");
    } else if (ext === ".mov") {
      res.setHeader("Content-Type", "video/quicktime");
    } else {
      res.setHeader("Content-Type", "application/octet-stream");
    }
    res.send(decryptedBuffer);

    // Audit log for successful file download
    await AuditLogger.logFileDownload(
      recipientEmail,
      decryptedFileName,
      true,
      ipAddress,
      userAgent,
      storageToken
    );

    otpStore.delete(token);

    // Delete file from S3 after download
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
        })
      );
      console.log(`✅ File ${filename} deleted from S3 after download.`);
    } catch (err) {
      console.error("❌ Failed to delete file from S3:", err.message);
    }

    // Update file_shares status after successful download
    const { error: updateError } = await supabase
      .from("file_shares")
      .update({
        status: "Downloaded",
        download_time: new Date().toISOString(),
      })
      .eq("storage_token", storageToken)
      .eq("status", "Pending"); // Make sure this matches your DB enum

    if (updateError) {
      console.error("❌ Error updating status:", updateError.message);
    } else {
      console.log("✅ Supabase status updated for token:", storageToken);
      // Clean up unused keys after successful download
      setTimeout(() => forceCleanupOldKeys(), 2000);
    }
  } catch (err) {
    // Handle JWT verification errors specifically
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.error("❌ JWT verification failed:", err.message);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or expired access token" 
      });
    }
    
    console.error("❌ Download process failed:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Download process failed." 
    });
  }
};

// Helper to convert S3 stream to buffer
async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
