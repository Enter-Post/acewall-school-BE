import NodeClam from 'clamscan';
import { Readable } from 'stream';
import fs from 'fs';

let clamscan;

// Initialize ClamAV
const initClamAV = async () => {
  try {
    clamscan = await new NodeClam().init({
      removeInfected: true, // Auto-remove infected files if using disk
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      fileList: null,
      scanRecursively: true,
      clamscan: {
        path: 'clamscan', // Path to clamscan binary on your server
        db: null,
        scanArchives: true,
        active: true
      },
      clamdscan: {
        socket: false,
        host: '127.0.0.1',
        port: 3310,
        timeout: 60000,
        localFallback: true,
        path: 'clamdscan',
        configFile: null,
        multiscan: true,
        reloadDb: false,
        active: true,
        bypassTest: false,
      },
      preference: 'clamdscan' // Prefer daemon for speed
    });
    console.log('✅ ClamAV Antivirus scanner initialized successfully.');
  } catch (err) {
    // Graceful fallback for development environments where ClamAV is not installed.
    // In production, you MUST have ClamAV installed and running.
    console.warn('⚠️ ClamAV Initialization Warning: Antivirus scanning is currently disabled because ClamAV could not be reached. Ensure ClamAV is installed and running if you are in production.');
    clamscan = null; 
  }
};

initClamAV();

export const scanMalware = async (req, res, next) => {
  try {
    // If ClamAV isn't running (e.g., local dev environment), bypass gracefully
    if (!clamscan) {
      return next(); 
    }

    let files = [];
    if (req.file) files.push(req.file);
    if (req.files && Array.isArray(req.files)) {
      files = [...files, ...req.files];
    } else if (req.files && typeof req.files === 'object') {
      for (const key in req.files) {
        if (Object.prototype.hasOwnProperty.call(req.files, key)) {
          files = [...files, ...req.files[key]];
        }
      }
    }

    if (files.length === 0) return next();

    for (const file of files) {
      let isInfected = false;
      let viruses = [];

      try {
        if (file.path && fs.existsSync(file.path)) {
          // Scan file on disk
          const result = await clamscan.isInfected(file.path);
          isInfected = result.isInfected;
          viruses = result.viruses || [];
        } else if (file.buffer) {
          // Scan file in memory via streams
          const stream = Readable.from(file.buffer);
          const result = await clamscan.scanStream(stream);
          isInfected = result.isInfected;
          viruses = result.viruses || [];
        }
      } catch (scanErr) {
        console.error(`Error scanning file ${file.originalname}:`, scanErr);
        // Fail-safe: Block upload if scanner throws an error
        return res.status(500).json({ message: "Security scan failed. Please try again." });
      }

      if (isInfected) {
        console.error(`🚨 MALWARE DETECTED in file ${file.originalname}:`, viruses);
        
        // Clean up from disk immediately
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return res.status(400).json({ 
          message: "Malware detected! The uploaded file was rejected.",
          viruses: viruses
        });
      }
    }

    next();
  } catch (error) {
    console.error("Antivirus Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error during malware scanning." });
  }
};
