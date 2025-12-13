import multer from "multer";
import path from "path";

const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50 MB limit

// Allowed document MIME types
const allowedDocTypes = {
  "application/pdf": "pdf",
  "application/msword": "word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "word",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "file"; // default folder for documents

    if (file.mimetype.startsWith("video/")) {
      folder = "videos";
    } else if (file.mimetype.startsWith("image/")) {
      folder = "image";
    } else if (allowedDocTypes[file.mimetype]) {
      folder = "file"; // PDF / Word / Excel
    } else {
      return cb(new Error("Invalid file type. Only images, videos, PDF, Word, and Excel files are allowed."));
    }

    cb(null, `uploads/${folder}`);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMIT },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      allowedDocTypes[file.mimetype]
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file format."));
    }
  },
});

export { upload };
