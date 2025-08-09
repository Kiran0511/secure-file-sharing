const axios = require("axios")

async function verifyTurnstile(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!token || !secret) return false

  try {
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret,
        response: token,
        remoteip: remoteip || "",
      })
    )
    return response.data.success
  } catch (err) {
    console.error("Turnstile verification error:", err)
    return false
  }
}

module.exports = verifyTurnstile