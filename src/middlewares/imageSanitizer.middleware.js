import sharp from 'sharp';
import fs from 'fs';

export const sanitizeImages = async (req, res, next) => {
  try {
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
      if (!file.mimetype.startsWith('image/')) continue; // Skip non-images

      try {
        if (file.buffer) {
          // Memory Storage Processing
          const sanitizedBuffer = await sharp(file.buffer)
            .rotate() // Automatically rotate based on EXIF orientation before stripping EXIF
            .resize({ width: 4000, height: 4000, fit: 'inside', withoutEnlargement: true }) // Prevent pixel-bomb attacks
            .toBuffer(); // By default, sharp strips all metadata (EXIF, XMP, etc.)
            
          file.buffer = sanitizedBuffer;
          file.size = sanitizedBuffer.length;
        } else if (file.path && fs.existsSync(file.path)) {
          // Disk Storage Processing
          const tempPath = `${file.path}.tmp`;
          await sharp(file.path)
            .rotate()
            .resize({ width: 4000, height: 4000, fit: 'inside', withoutEnlargement: true })
            .toFile(tempPath);
            
          // Replace original file with the sanitized version
          fs.unlinkSync(file.path);
          fs.renameSync(tempPath, file.path);
          
          const stats = fs.statSync(file.path);
          file.size = stats.size;
        }
      } catch (err) {
        console.error(`Image Sanitization Failed for ${file.originalname}:`, err);
        
        // Clean up malicious/corrupted files from disk to prevent storage buildup
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        // Reject the request because the file is not a valid image
        return res.status(400).json({ message: `Image sanitization failed for ${file.originalname}. The file may be corrupted or contain malicious payload.` });
      }
    }

    next();
  } catch (error) {
    console.error("Image Sanitization Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error during image sanitization." });
  }
};
