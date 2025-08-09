// scripts/rotateKey.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const supabase = require("../supabase/supabaseClient");

async function rotateKey() {
  const keyDir = path.join(__dirname, "../keys");
  const metaPath = path.join(keyDir, "key-version.json");

  let meta = { currentVersion: "v0" };
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath));
  }

  const currentNum = parseInt(meta.currentVersion.replace("v", ""));
  const newNum = currentNum + 1;
  const newVersion = `v${newNum}`;

  const privateKeyPath = path.join(keyDir, `private_${newVersion}.pem`);
  const publicKeyPath = path.join(keyDir, `public_${newVersion}.pem`);

  try {
    execSync(`openssl genrsa -out ${privateKeyPath} 2048`);
    execSync(`openssl rsa -in ${privateKeyPath} -pubout -out ${publicKeyPath}`);

    // Clean up old keys that are no longer needed
    await cleanupOldKeys(keyDir, currentNum);

    meta.currentVersion = newVersion;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    console.log(`🔁 Key rotated after upload: ${newVersion}`);
  } catch (err) {
    console.error("❌ RSA key rotation failed:", err.message);
  }
}

async function cleanupOldKeys(keyDir, currentNum) {
  try {
    // Get all pending files to see which key versions are still needed
    const { data: activeFiles, error } = await supabase
      .from("file_shares")
      .select("file_name")
      .in("status", ["Pending"]);

    if (error) {
      console.error("❌ Error checking active files:", error.message);
      return;
    }

    console.log(`📊 Found ${activeFiles?.length || 0} pending files during rotation`);

    // If no pending files, we can be more aggressive
    if (!activeFiles || activeFiles.length === 0) {
      console.log("🧹 No pending files found. Performing aggressive cleanup during rotation...");
      
      // Delete all keys except the current and newly created one
      for (let i = 1; i < currentNum; i++) {
        const versionToCheck = `v${i}`;
        const oldPrivate = path.join(keyDir, `private_${versionToCheck}.pem`);
        const oldPublic = path.join(keyDir, `public_${versionToCheck}.pem`);
        
        if (fs.existsSync(oldPrivate)) {
          fs.unlinkSync(oldPrivate);
          console.log(`🗑️ Deleted old private key during rotation: private_${versionToCheck}.pem`);
        }
        if (fs.existsSync(oldPublic)) {
          fs.unlinkSync(oldPublic);
          console.log(`🗑️ Deleted old public key during rotation: public_${versionToCheck}.pem`);
        }
      }
    } else {
      // Keep only the last 2 versions when there are pending files
      const versionsToKeep = 2;
      
      for (let i = 1; i < currentNum - versionsToKeep; i++) {
        const versionToCheck = `v${i}`;
        const oldPrivate = path.join(keyDir, `private_${versionToCheck}.pem`);
        const oldPublic = path.join(keyDir, `public_${versionToCheck}.pem`);
        
        if (fs.existsSync(oldPrivate)) {
          fs.unlinkSync(oldPrivate);
          console.log(`🗑️ Deleted old private key during rotation: private_${versionToCheck}.pem`);
        }
        if (fs.existsSync(oldPublic)) {
          fs.unlinkSync(oldPublic);
          console.log(`🗑️ Deleted old public key during rotation: public_${versionToCheck}.pem`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Error during key cleanup:", err.message);
  }
}

module.exports = { rotateKey };
