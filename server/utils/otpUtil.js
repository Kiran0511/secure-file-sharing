const nodemailer = require("nodemailer");
require("dotenv").config();

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
async function sendOTP(email, otp) {
  const info = await transporter.sendMail({
    from: `"Secure File Share" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Your OTP to Download File",
    text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
  });
  console.log("📩 OTP sent to:", email);
}

// Save OTP with expiration in otpStore
function storeOTP(token, otp) {
  otpStore.set(token, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
}

// Validate OTP
function isOTPValid(token, enteredOtp) {
  const record = otpStore.get(token);
  if (!record) return false;
  const { otp, expiresAt } = record;
  const isExpired = Date.now() > expiresAt;
  const isCorrect = otp === enteredOtp;
  return !isExpired && isCorrect;
}

// Delete OTP after verification or expiry
function deleteOTP(token) {
  otpStore.delete(token);
}

module.exports = {
  sendOTP,
  generateOTP,
  storeOTP,
  isOTPValid,
  deleteOTP,
  otpStore, // ✅ Exported now
};
