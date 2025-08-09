const { exec } = require('child_process');
const path = require('path');

const scanWithDefender = (filePath) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(filePath);

    const command = `powershell "Start-MpScan -ScanType CustomScan -ScanPath '${fullPath}'"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Defender Scan Error: ${stderr || error.message}`);
        return reject(new Error('Defender scan failed.'));
      }

      if (stdout.includes('Threat')) {
        console.log('🚨 Virus detected in upload');
        return resolve({ isInfected: true, message: stdout });
      }

      console.log('✅ Defender scan passed');
      return resolve({ isInfected: false, message: stdout });
    });
  });
};

module.exports = { scanWithDefender };
