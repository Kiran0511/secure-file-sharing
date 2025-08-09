const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { execSync } = require("child_process");
const { randomUUID } = require("crypto");
const pendingFiles = new Map();
const supabase = require('./supabase/supabaseClient');
const { scanFileForVirus } = require("./utils/virusScanner");
require("dotenv").config();

const {
  generateAESKey,
  encryptFile,
  decryptFile,
} = require("./utils/aesUtil");

const {
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
} = require("./utils/rsaUtil");

const { sendOTP, generateOTP } = require("./utils/otpUtil");

const app = express();
const upload = multer({ dest: "temp/" });
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));

const otpStore = new Map();

try {
  execSync("node scripts/rotateKey.js");
  console.log("\uD83D\uDD01 RSA key rotated on server start");
} catch (err) {
  console.error("\u274C RSA key rotation failed:", err.message);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "upload.html"));
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const email = req.body.receiverEmail;
  const filePath = req.file.path;
  const originalName = req.file.originalname;

  // ✅ Virus scan before encryption
  try {
    const { isInfected, viruses } = await scanFileForVirus(filePath);
    if (isInfected) {
      fs.unlinkSync(filePath);
      console.log("\uD83D\uDEA8 Virus detected in upload:", viruses);
      return res.status(400).send("\u26A0\uFE0F File upload rejected: Virus detected.");
    }
  } catch (err) {
    console.error("\u274C Virus scan error:", err.message || err);
    fs.unlinkSync(filePath);
    return res.status(500).send("\u274C Virus scanning failed. Upload aborted.");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const aesKey = generateAESKey();
  const iv = crypto.randomBytes(16);
  const encryptedData = encryptFile(fileBuffer, aesKey, iv);
  const { encryptedKey, keyVersion } = encryptAESKeyWithRSA(aesKey);

  const encryptedFileName = `${originalName}.enc`;
  const outputFilePath = path.join(__dirname, "uploads", encryptedFileName);
  fs.writeFileSync(outputFilePath, encryptedData);
  fs.unlinkSync(filePath);

  const { senderEmail, receiverEmail } = req.body;
  if (!senderEmail || !receiverEmail) {
    console.log("\u274C Sender or receiver email is missing.");
    return res.status(400).send("\u274C Sender and receiver email are required.");
  }

  const storageToken = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("file_shares").insert([
    {
      sender_email: senderEmail,
      receiver_email: receiverEmail,
      storage_token: storageToken,
      status: "pending",
      expiry_time: expiresAt,
    },
  ]);

  if (insertError) {
    console.error("\u274C Supabase insert error:", insertError.message);
    return res.status(500).send("\u274C Failed to store metadata.");
  }

  const downloadToken = jwt.sign(
    {
      filename: encryptedFileName,
      encryptedAESKey: encryptedKey.toString("base64"),
      iv: iv.toString("base64"),
      keyVersion,
      storageToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  const otp = generateOTP();
  const otpExpiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(downloadToken, { otp, expiresAt: otpExpiresAt });
  await sendOTP(email, otp);
  console.log(`\uD83D\uDCE8 OTP sent to ${email}: ${otp}`);

  res.send(`
    <h3>✅ File uploaded and encrypted successfully.</h3>
    <p><strong>Access Token:</strong></p>
    <textarea cols="100" rows="3">${downloadToken}</textarea>
    <p>📧 OTP has been sent to: <strong>${email}</strong></p>
    <p>➡️ <a href="/download" target="_blank">Receiver Download Page</a></p>
  `);

  const deleteTimeout = setTimeout(async () => {
    const filePathToDelete = path.join(__dirname, "uploads", encryptedFileName);

    if (fs.existsSync(filePathToDelete)) {
      fs.unlinkSync(filePathToDelete);
      console.log(`\uD83D\uDDD1️ Auto-deleted after timeout: ${encryptedFileName}`);
    }

    pendingFiles.delete(encryptedFileName);

    const { error: updateError } = await supabase
      .from("file_shares")
      .update({
        status: "Timeout",
      })
      .eq("storage_token", storageToken)
      .eq("status", "pending");

    if (updateError) {
      console.error("\u274C Error updating status:", updateError.message);
    } else {
      console.log("✅ Supabase status updated for token:", storageToken);
    }
  }, 5 * 60 * 1000);

  pendingFiles.set(encryptedFileName, deleteTimeout);
});

app.get("/download", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "download.html"));
});

app.post("/verify-otp", async (req, res) => {
  const { token, otp } = req.body;

  const record = otpStore.get(token);
  if (!record || Date.now() > record.expiresAt || record.otp !== otp) {
    return res.status(403).send("\u274C Invalid or expired OTP");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { filename, encryptedAESKey, iv, keyVersion, storageToken } = decoded;

    const aesKey = decryptAESKeyWithRSA(Buffer.from(encryptedAESKey, "base64"), keyVersion);
    const encryptedFilePath = path.join(__dirname, "uploads", filename);
    const decryptedFileName = filename.replace(".enc", "");
    const encryptedData = fs.readFileSync(encryptedFilePath);
    const decryptedBuffer = decryptFile(encryptedData, aesKey, Buffer.from(iv, "base64"));

    res.setHeader("Content-Disposition", `attachment; filename=${decryptedFileName}`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decryptedBuffer);

    otpStore.delete(token);
    fs.unlinkSync(encryptedFilePath);
    console.log(`✅ File ${filename} downloaded and auto-deleted.`);

    const { error: updateError } = await supabase
      .from("file_shares")
      .update({
        status: "Downloaded",
        download_time: new Date().toISOString(),
      })
      .eq("storage_token", storageToken)
      .eq("status", "pending");

    if (updateError) {
      console.error("\u274C Error updating status:", updateError.message);
    } else {
      console.log("✅ Supabase status updated for token:", storageToken);
    }
  } catch (err) {
    console.error("\u274C Decryption failed:", err.message);
    res.status(500).send("\u274C Decryption failed.");
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admindashboard.html"));
});

app.get("/admin/dashboard", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("file_shares")
      .select("*")
      .order("upload_time", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Dashboard error:", err.message);
    res.status(500).send("Error loading dashboard");
  }
});

app.get('/admin/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_shares')
      .select('status');

    if (error) throw error;

    let total_downloads = 0;
    let expired_tokens = 0;

    data.forEach(log => {
      if (log.status === 'Downloaded') total_downloads++;
      if (log.status === 'Timeout') expired_tokens++;
    });

    res.json({ total_downloads, expired_tokens });
  } catch (err) {
    console.error("❌ Error in summary:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


app.listen(3000, '0.0.0.0', () => {
  console.log("\uD83D\uDE80 Server running at http://localhost:3000");
});
