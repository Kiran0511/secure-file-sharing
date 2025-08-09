const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function getCurrentKeyVersion() {
  const meta = JSON.parse(fs.readFileSync("keys/key-version.json"));
  return meta.currentVersion;
}

function encryptAESKeyWithRSA(aesKey) {
  const version = getCurrentKeyVersion();
  const publicKey = fs.readFileSync(`keys/public_${version}.pem`, "utf8");
  const encryptedKey = crypto.publicEncrypt(publicKey, aesKey);
  return { encryptedKey, keyVersion: version };
}

function decryptAESKeyWithRSA(encryptedKeyBuffer, version) {
  const privateKey = fs.readFileSync(`keys/private_${version}.pem`, "utf8");
  return crypto.privateDecrypt(privateKey, encryptedKeyBuffer);
}

module.exports = { encryptAESKeyWithRSA, decryptAESKeyWithRSA };
