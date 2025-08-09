const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE;

const client = twilio(accountSid, authToken);


async function sendOTPSMS(toPhone, otp) {
  try {
    const message = await client.messages.create({
      body: `🔐 Your OTP for file download is: ${otp}`,
      from: fromPhone,
      to: toPhone,
    });
    console.log(`📨 SMS sent to ${toPhone}: ${otp}`);
    return message.sid;
  } catch (err) {
    console.error("❌ Failed to send OTP via SMS:", err.message);
    throw err;
  }
}

module.exports = { sendOTPSMS };
