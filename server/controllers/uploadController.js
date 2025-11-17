const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");

const supabase = require("../supabase/supabaseClient");
const { scanFileForVirus } = require("../utils/virusScanner");
const { encryptFile, generateAESKey } = require("../utils/aesUtil");
const { encryptAESKeyWithRSA } = require("../utils/rsaUtil");
const { generateOTP, otpStore } = require("../utils/otpUtil");
const { sendOTPSMS } = require("../utils/twilioUtil");
const { rotateKey } = require("../scripts/rotateKey");
const { generateAccessTokenEmail } = require("../utils/accesstokenUtils");
const s3Client = require("../cloud/awsConfig");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { cleanupUnusedKeys, forceCleanupOldKeys } = require("../utils/keyCleanup");
const AuditLogger = require("../utils/auditLogger");

const pendingFiles = new Map();

exports.handleUpload = async function (req, res) {
  const email = req.body.receiverEmail;
  const phoneNumber = "+91" + req.body.phoneNumber;
  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const senderEmail = req.body.senderEmail || 'unknown@system'; // Get sender email from request
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  console.log(`📤 Upload initiated by ${senderEmail} for ${email} - File: ${originalName}`);

  // ✅ Virus scan before encryption
  try {
    const { isInfected, viruses } = await scanFileForVirus(filePath);
    if (isInfected) {
      fs.unlinkSync(filePath);
      console.log("🚨 Virus detected in upload:", viruses);
      
      // Audit log for failed upload due to virus
      await AuditLogger.logFileUpload(
        senderEmail, 
        originalName, 
        req.file.size, 
        ipAddress, 
        userAgent, 
        'FAILED', 
        { reason: 'virus_detected', viruses: viruses }
      );
      
      return res.status(400).send("⚠️ File upload rejected: Virus detected.");
    }
  } catch (err) {
    console.error("❌ Virus scan error:", err.message || err);
    fs.unlinkSync(filePath);
    
    // Audit log for failed upload due to scan error
    await AuditLogger.logFileUpload(
      senderEmail, 
      originalName, 
      req.file.size, 
      ipAddress, 
      userAgent, 
      'FAILED', 
      { reason: 'virus_scan_error', error: err.message }
    );
    
    return res.status(500).send("❌ Virus scanning failed. Upload aborted.");
  }

  try {
    await rotateKey();
    console.log("\uD83D\uDD01 RSA key rotated on server start");
  } catch (err) {
    console.error("\u274C RSA key rotation failed:", err.message);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const aesKey = generateAESKey();
  const iv = crypto.randomBytes(16);
  const encryptedData = encryptFile(fileBuffer, aesKey, iv);
  const { encryptedKey, keyVersion } = encryptAESKeyWithRSA(aesKey);

  // Generate a unique filename with timestamp
  const timestamp = Date.now();
  const encryptedFileName = `${timestamp}_${originalName}.enc`;
  const outputFilePath = path.join(__dirname, "../uploads", encryptedFileName);
  fs.writeFileSync(outputFilePath, encryptedData);
  fs.unlinkSync(filePath);

  // Upload encrypted file to S3
  let s3Key = `uploads/${encryptedFileName}`;
  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    console.log("Uploading to S3 bucket:", bucketName, "with key:", s3Key);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: encryptedData,
        ContentType: "application/octet-stream",
      })
    );
    console.log(`☁️ Encrypted file uploaded to S3: ${s3Key}`);
    fs.unlinkSync(outputFilePath);
  } catch (err) {
    console.error("❌ S3 upload failed:", err.message);
  }

  const { receiverEmail } = req.body;
  if (!receiverEmail) {
    console.log("❌ Receiver email is missing.");
    return res.status(400).send("❌ Receiver email is required.");
  }

  const user = req.user; 

  const storageToken = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("file_shares").insert([
    {
      user_id: user.id,
      sender_email: user.email, 
      receiver_email: receiverEmail,
      storage_token: storageToken,
      status: "Pending",
      expiry_time: expiresAt,
      file_name: encryptedFileName,
    },
  ]);

  if (insertError) {
    console.error("❌ Supabase insert error:", insertError.message);
    return res.status(500).send("❌ Failed to store metadata.");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("❌ JWT_SECRET not found in environment variables");
    return res.status(500).send("❌ Server configuration error.");
  }

  const downloadToken = jwt.sign(
    {
      filename: encryptedFileName,
      encryptedAESKey: encryptedKey.toString("base64"),
      iv: iv.toString("base64"),
      keyVersion,
      storageToken,
    },
    jwtSecret,
    { expiresIn: "5m" }
  );

  const otp = generateOTP();
  const otpExpiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(downloadToken, { otp, expiresAt: otpExpiresAt });

  // Audit log for successful token generation
  await AuditLogger.logTokenGeneration(
    senderEmail,
    'DOWNLOAD_TOKEN',
    email,
    new Date(otpExpiresAt).toISOString(),
    ipAddress,
    userAgent,
    storageToken
  );

  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const downloadUrl = `http://localhost:3001/download?token=${encodeURIComponent(downloadToken)}`; // Include token in URL

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "🔐 Secure File Download Access Details",
    html: generateAccessTokenEmail({
      accessToken: downloadToken,
      downloadUrl,
    }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📨 Access token & link emailed to: ${email}`);
    
    // Audit log for OTP generation (email)
    await AuditLogger.logOTPGeneration(
      email,
      'email',
      ipAddress,
      userAgent,
      storageToken
    );
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }

  if (phoneNumber) {
    try {
      await sendOTPSMS(phoneNumber, otp);
      console.log(`📨 OTP SMS sent to ${phoneNumber}`);
      
      // Audit log for OTP generation (SMS)
      await AuditLogger.logOTPGeneration(
        email,
        'sms',
        ipAddress,
        userAgent,
        storageToken
      );
    } catch (smsError) {
      console.error("❌ Error sending OTP SMS:", smsError.message || smsError);
    }
  } else {
    console.warn("⚠️ Phone number not provided. SMS not sent.");
  }
  
  // Audit log for successful file upload
  await AuditLogger.logFileUpload(
    senderEmail,
    originalName,
    req.file.size,
    ipAddress,
    userAgent,
    'SUCCESS'
  );
  
  // ✅ Response for normal operation (no longer testing mode)
  res.json({
    success: true,
    message: "File uploaded and encrypted successfully. Access token and OTP have been sent.",
    uploadInfo: {
      fileName: originalName,
      expiresAt: new Date(otpExpiresAt).toISOString(),
      emailSentTo: email,
      smsSentTo: phoneNumber
    }
  });

  const deleteTimeout = setTimeout(async () => {
    // Fetch file_name from Supabase for this storageToken
    const { data: fileShare, error: fetchError } = await supabase
      .from("file_shares")
      .select("status, file_name")
      .eq("storage_token", storageToken)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching file status for auto-delete:", fetchError.message);
      return;
    }

    if (fileShare && fileShare.status === "Pending") {
      const filePathToDelete = path.join(__dirname, "../uploads", fileShare.file_name);

      // Delete local file if exists
      if (fs.existsSync(filePathToDelete)) {
        fs.unlinkSync(filePathToDelete);
        console.log(`🗑️ Auto-deleted after timeout: ${fileShare.file_name}`);
      }

      // Delete from S3 using file_name
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `uploads/${fileShare.file_name}`,
        }));
        console.log(`🗑️ Auto-deleted from S3: uploads/${fileShare.file_name}`);
      } catch (err) {
        console.error("❌ Failed to delete from S3:", err.message);
      }

      pendingFiles.delete(fileShare.file_name);

      const { error: updateError } = await supabase
        .from("file_shares")
        .update({
          status: "Expired",
        })
        .eq("storage_token", storageToken)
        .eq("status", "Pending");

      if (updateError) {
        console.error("❌ Error updating status:", updateError.message);
      } else {
        console.log("✅ Supabase status updated for token:", storageToken);
        // Clean up unused keys after file expiration
        setTimeout(() => forceCleanupOldKeys(), 2000);
      }
    } else {
      console.log(`⏩ Auto-delete skipped for ${fileShare?.file_name} (status is not Pending)`);
    }
  }, 5 * 60 * 1000);

  pendingFiles.set(encryptedFileName, deleteTimeout);
};

exports.pendingFiles = pendingFiles;
