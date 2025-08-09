const NodeClam = require('clamscan');

let clamscanInstance = null;

const initClamScan = async () => {
  if (clamscanInstance) return clamscanInstance;

  const clamscan = await new NodeClam().init({
    removeInfected: false,
    quarantineInfected: false,
    debugMode: true,
    preference: 'clamdscan',
    clamdscan: {
      socket: false,              // Use TCP, not Unix socket
      host: '127.0.0.1',          // Docker container is mapped to localhost
      port: 3310,                 // Exposed port
      timeout: 60000,             // 60 seconds timeout
      localFallback: false        // Disable fallback to local binary
    },
  });

  clamscanInstance = clamscan;
  return clamscan;
};

const scanFileForVirus = async (filePath) => {
  const clamscan = await initClamScan();
  const { isInfected, viruses } = await clamscan.isInfected(filePath);
  return { isInfected, viruses };
};

module.exports = { scanFileForVirus };
