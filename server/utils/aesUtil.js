const crypto = require("crypto");

function generateAESKey() {
  return crypto.randomBytes(32);
}

function encryptFile(buffer, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

function decryptFile(encryptedBuffer, key, iv) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}



module.exports = { generateAESKey, encryptFile, decryptFile };
