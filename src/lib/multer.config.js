import multer from "multer";
import { validateFileSecurity } from "../middlewares/fileSecurity.middleware.js";
import { sanitizeImages } from "../middlewares/imageSanitizer.middleware.js";
import { scanMalware } from "../middlewares/antivirus.middleware.js";
import { uploadRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const storage = multer.memoryStorage();

// Default secure upload instance
const rawUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 20, // max 20 files per request
    fields: 100 // max 100 text fields
  }
});

// Centralized wrapper to automatically apply rate limiting, magic bytes security, AV, and image sanitization
export const upload = {
  single: (fieldName) => [uploadRateLimiter, rawUpload.single(fieldName), validateFileSecurity, scanMalware, sanitizeImages],
  array: (fieldName, maxCount) => [uploadRateLimiter, rawUpload.array(fieldName, maxCount), validateFileSecurity, scanMalware, sanitizeImages],
  fields: (fields) => [uploadRateLimiter, rawUpload.fields(fields), validateFileSecurity, scanMalware, sanitizeImages],
  any: () => [uploadRateLimiter, rawUpload.any(), validateFileSecurity, scanMalware, sanitizeImages],
};

// Secure dynamic field handler for Assessments
const createAssessmentFields = () => {
  const fields = [
    { name: "files", maxCount: 20 },
    { name: "attachments", maxCount: 20 }
  ];
  // Support dynamic frontend fields like question_0_file_0
  for (let q = 0; q < 50; q++) {
    for (let f = 0; f < 10; f++) {
      fields.push({ name: `question_${q}_file_${f}`, maxCount: 1 });
    }
  }
  return fields;
};

const dynamicAssessmentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 30, // up to 30 files for a large assessment
    fields: 200
  }
}).fields(createAssessmentFields());

// Middleware to flatten req.files object into an array (mimicking upload.any() output for backward compatibility)
export const flattenFiles = (req, res, next) => {
  if (req.files && !Array.isArray(req.files)) {
    const flatFiles = [];
    for (const key in req.files) {
      if (Object.prototype.hasOwnProperty.call(req.files, key)) {
        flatFiles.push(...req.files[key]);
      }
    }
    req.files = flatFiles;
  }
  next();
};

export const safeAnyUpload = [uploadRateLimiter, dynamicAssessmentUpload, flattenFiles, validateFileSecurity, scanMalware, sanitizeImages];

// Replacing old upload.any() usage safely
const lessonUploadMiddleware = safeAnyUpload;

export default lessonUploadMiddleware;
