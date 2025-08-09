// utils/keyCleanup.js
const fs = require("fs");
const path = require("path");
const supabase = require("../supabase/supabaseClient");

async function cleanupUnusedKeys() {
  const keyDir = path.join(__dirname, "../keys");
  
  try {
    // Get all pending files to see which key versions are still needed
    const { data: pendingFiles, error } = await supabase
      .from("file_shares")
      .select("file_name")
      .eq("status", "Pending");

    if (error) {
      console.error("❌ Error checking pending files for key cleanup:", error.message);
      return;
    }

    // Get current key version
    const metaPath = path.join(keyDir, "key-version.json");
    let meta = { currentVersion: "v0" };
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath));
    }

    const currentNum = parseInt(meta.currentVersion.replace("v", ""));
    
    // Find which key versions are still in use by pending files
    const keysInUse = new Set();
    
    // Always keep the current key
    keysInUse.add(meta.currentVersion);
    
    // Check which keys are needed for pending files
    // Since we don't store key version with files, we need to be conservative
    // and check if there are any pending files at all
    if (pendingFiles && pendingFiles.length > 0) {
      // Keep the last 2 versions if there are pending files
      for (let i = Math.max(1, currentNum - 1); i <= currentNum; i++) {
        keysInUse.add(`v${i}`);
      }
    }
    
    // Delete keys that are not in use and not the current key
    for (let i = 1; i < currentNum; i++) {
      const versionToCheck = `v${i}`;
      
      // Only delete if not in use and not one of the last 2 versions when pending files exist
      if (!keysInUse.has(versionToCheck)) {
        const oldPrivate = path.join(keyDir, `private_${versionToCheck}.pem`);
        const oldPublic = path.join(keyDir, `public_${versionToCheck}.pem`);
        
        if (fs.existsSync(oldPrivate)) {
          fs.unlinkSync(oldPrivate);
          console.log(`🗑️ Cleaned up old private key: private_${versionToCheck}.pem`);
        }
        if (fs.existsSync(oldPublic)) {
          fs.unlinkSync(oldPublic);
          console.log(`🗑️ Cleaned up old public key: public_${versionToCheck}.pem`);
        }
      }
    }
    
    console.log(`🔑 Key cleanup completed. Keys in use: ${Array.from(keysInUse).join(', ')}`);
  } catch (err) {
    console.error("❌ Error during key cleanup:", err.message);
  }
}

async function forceCleanupOldKeys() {
  const keyDir = path.join(__dirname, "../keys");
  
  try {
    // Get current key version
    const metaPath = path.join(keyDir, "key-version.json");
    let meta = { currentVersion: "v0" };
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath));
    }

    const currentNum = parseInt(meta.currentVersion.replace("v", ""));
    
    // Get all pending files to see which key versions are still needed
    const { data: pendingFiles, error } = await supabase
      .from("file_shares")
      .select("file_name")
      .eq("status", "Pending");

    if (error) {
      console.error("❌ Error checking pending files for force cleanup:", error.message);
      return;
    }

    // If no pending files, we can be more aggressive in cleanup
    if (!pendingFiles || pendingFiles.length === 0) {
      console.log("🧹 No pending files found. Performing aggressive key cleanup...");
      
      // Delete all keys except the current one
      for (let i = 1; i < currentNum; i++) {
        const versionToCheck = `v${i}`;
        const oldPrivate = path.join(keyDir, `private_${versionToCheck}.pem`);
        const oldPublic = path.join(keyDir, `public_${versionToCheck}.pem`);
        
        if (fs.existsSync(oldPrivate)) {
          fs.unlinkSync(oldPrivate);
          console.log(`🗑️ Force deleted old private key: private_${versionToCheck}.pem`);
        }
        if (fs.existsSync(oldPublic)) {
          fs.unlinkSync(oldPublic);
          console.log(`🗑️ Force deleted old public key: public_${versionToCheck}.pem`);
        }
      }
    } else {
      console.log(`⏳ ${pendingFiles.length} pending files remain. Keeping last 2 key versions.`);
    }
  } catch (err) {
    console.error("❌ Error during force key cleanup:", err.message);
  }
}

module.exports = { cleanupUnusedKeys, forceCleanupOldKeys };
