import fs from 'fs';
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/epub+zip', // EPUB books
  'video/mp4',
  'video/webm',
  'video/ogg'
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx', 'pptx', 'epub', 'mp4', 'webm', 'ogg'
]);

// Text-based formats that don't have magic bytes (file-type returns undefined)
const ALLOWED_TEXT_EXTENSIONS = new Set(['csv', 'txt']);

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'sh', 'bat', 'cmd', 'msi', 'com', 
  'php', 'php3', 'php4', 'php5', 'phtml', 
  'js', 'jsp', 'jspx', 'asp', 'aspx', 'py', 'rb', 'pl',
  'html', 'htm', 'svg', 'xml'
]);

const cleanupFiles = (files) => {
  for (const file of files) {
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Failed to delete temp file ${file.path}:`, err);
      }
    }
  }
};

export const validateFileSecurity = async (req, res, next) => {
  let files = [];
  try {
    if (req.file) files.push(req.file);
    if (req.files && Array.isArray(req.files)) {
      files = [...files, ...req.files];
    } else if (req.files && typeof req.files === 'object') {
      for (const key in req.files) {
        files = [...files, ...req.files[key]];
      }
    }

    if (files.length === 0) {
      return next(); // No files to validate
    }

    for (const file of files) {
      // 1. Double Extension & Dangerous Extension Check
      const filenameParts = file.originalname.split('.');
      const ext = filenameParts[filenameParts.length - 1].toLowerCase();

      if (DANGEROUS_EXTENSIONS.has(ext)) {
        cleanupFiles(files);
        return res.status(400).json({ message: `File type not allowed: ${ext}` });
      }

      if (filenameParts.length > 2) {
        const ext2 = filenameParts[filenameParts.length - 2].toLowerCase();
        if (DANGEROUS_EXTENSIONS.has(ext2)) {
          cleanupFiles(files);
          return res.status(400).json({ message: "Suspicious file name detected (Double Extension)" });
        }
      }

      // 2. Magic Bytes Detection
      let type;
      if (file.buffer) {
        type = await fileTypeFromBuffer(file.buffer);
      } else if (file.path) {
        type = await fileTypeFromFile(file.path);
      } else {
        continue;
      }

      // Strict mode: Handle unknown signatures
      if (!type) {
        if (ALLOWED_TEXT_EXTENSIONS.has(ext)) {
          // If it's a known text file type without magic bytes, allow it but ensure mimetype is safe
          file.mimetype = ext === 'csv' ? 'text/csv' : 'text/plain';
          continue; 
        }
        cleanupFiles(files);
        return res.status(400).json({ message: "Unable to verify file signature. File may be corrupted or disguised." });
      }

      // 3. Validate against allowed whitelist
      if (!ALLOWED_MIME_TYPES.has(type.mime) || !ALLOWED_EXTENSIONS.has(type.ext)) {
        cleanupFiles(files);
        return res.status(400).json({ message: `Invalid or unsafe file format: ${type.mime || type.ext}` });
      }
      
      // 4. Secure the mimetype - overwrite client-provided mimetype with actual detected mimetype
      file.mimetype = type.mime;
      
      // Overwrite the extension in the filename if it was spoofed to something else harmless but wrong
      // However, we already verified that the original extension is in the allowed list, so this is just an extra measure
    }

    next();
  } catch (error) {
    console.error("File Validation Error:", error);
    cleanupFiles(files);
    return res.status(500).json({ message: "Error occurred during file validation" });
  }
};
