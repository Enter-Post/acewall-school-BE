import { google } from "googleapis";
import cloudinary from "cloudinary";
import { asyncHandler } from "../middlewares/errorHandler.middleware.js";
import User from "../Models/user.model.js";
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from "../Utiles/errors.js";
import { AppError as ApiError } from "../Utiles/errors.js";
import {
  getValidAccessToken,
  createOAuth2Client,
} from "./googleDrive.controller.js";
import fs from "fs";
import path from "path";
import os from "os";
import { validateFileSecurity } from "../middlewares/fileSecurity.middleware.js";
import { scanMalware } from "../middlewares/antivirus.middleware.js";
import { sanitizeImages } from "../middlewares/imageSanitizer.middleware.js";

const cloudinaryV2 = cloudinary.v2;

const getResourceType = (mimeType) => {
  if (!mimeType) return "raw"; // Hardened: never use auto
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  
  // Default anything else (PDFs, Word docs, unknown types, HTML) to raw
  // This guarantees Content-Disposition: attachment, preventing XSS
  return "raw";
};

const generatePublicId = (fileName) => {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
  return `gd_${timestamp}_${sanitizedName}`;
};

const uploadStreamToCloudinary = (fileStream, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const resourceType = getResourceType(mimeType);
    const uploadOptions = {
      resource_type: resourceType,
      folder: "google_drive_uploads",
      public_id: generatePublicId(fileName),
      overwrite: true,
      timeout: 300000,
    };
    if (resourceType === "video") uploadOptions.chunk_size = 6000000;

    const uploadStream = cloudinaryV2.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(new Error(`Cloudinary upload failed: ${error.message}`));
      else resolve(result);
    });

    fileStream.pipe(uploadStream);
    fileStream.on("error", (error) => {
      uploadStream.destroy();
      reject(new Error(`Stream error: ${error.message}`));
    });
  });
};

const runSecurityPipeline = async (tempFilePath, originalname, mimetype, size) => {
  return new Promise((resolve, reject) => {
    const mockFile = { path: tempFilePath, originalname, mimetype, size };
    const mockReq = { file: mockFile };
    const mockRes = {
      status: (code) => ({
        json: (data) => reject(new Error(`Security block [${code}]: ${data.message || data.error}`))
      })
    };

    validateFileSecurity(mockReq, mockRes, (err) => {
      if (err) return reject(err);
      scanMalware(mockReq, mockRes, (err2) => {
        if (err2) return reject(err2);
        sanitizeImages(mockReq, mockRes, (err3) => {
          if (err3) return reject(err3);
          resolve(mockReq.file);
        });
      });
    });
  });
};

export const uploadFromGoogleDrive = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { fileId, fileName, mimeType } = req.body;
  if (!userId) throw new AuthenticationError("User not authenticated", "AUTH_001");
  if (!fileId) throw new ValidationError("File ID is required", "VAL_001");

  const accessToken = await getValidAccessToken(userId);
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = await drive.files.get({
    fileId: fileId,
    fields: "id, name, mimeType, size, thumbnailLink",
  });

  const fileSize = parseInt(fileMetadata.data.size || "0");
  if (fileSize > 500 * 1024 * 1024) throw new ValidationError("File size exceeds 500MB limit", "VAL_002");

  const response = await drive.files.get(
    { fileId: fileId, alt: "media" },
    { responseType: "stream", timeout: 300000 }
  );

  const tempFilePath = path.join(os.tmpdir(), `gd_${Date.now()}_${fileId}`);
  const writer = fs.createWriteStream(tempFilePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  let secureFile;
  try {
    secureFile = await runSecurityPipeline(
      tempFilePath,
      fileMetadata.data.name || fileName || "untitled",
      fileMetadata.data.mimeType || mimeType,
      fileSize
    );
  } catch (secError) {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    throw new ValidationError(secError.message, "SEC_001");
  }

  const secureStream = fs.createReadStream(secureFile.path);

  const uploadResult = await uploadStreamToCloudinary(
    secureStream,
    secureFile.originalname,
    secureFile.mimetype
  );

  if (fs.existsSync(secureFile.path)) fs.unlinkSync(secureFile.path);
  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

  return res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    file: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      filename: uploadResult.original_filename || fileMetadata.data.name,
      type: uploadResult.resource_type === "image" ? `image/${uploadResult.format}` : fileMetadata.data.mimeType,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type,
      size: uploadResult.bytes,
    },
    source: "google_drive",
  });
});

export const getGoogleDrivePickerToken = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new AuthenticationError("User not authenticated", "AUTH_001");

  const accessToken = await getValidAccessToken(userId);
  return res.status(200).json({
    success: true,
    accessToken,
    appId: process.env.GOOGLE_DRIVE_CLIENT_ID?.split("-")?.[0],
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
  });
});

export const uploadMultipleFromGoogleDrive = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { files } = req.body;
  if (!userId) throw new AuthenticationError("User not authenticated", "AUTH_001");
  if (!Array.isArray(files) || files.length === 0) throw new ValidationError("Files array is required", "VAL_001");
  if (files.length > 10) throw new ValidationError("Maximum 10 files allowed at once", "VAL_003");

  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const accessToken = await getValidAccessToken(userId);
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const fileMetadata = await drive.files.get({
        fileId: file.fileId,
        fields: "id, name, mimeType, size",
      });

      const fileSize = parseInt(fileMetadata.data.size || "0");
      if (fileSize > 500 * 1024 * 1024) throw new Error("File size exceeds 500MB limit");

      const response = await drive.files.get(
        { fileId: file.fileId, alt: "media" },
        { responseType: "stream" }
      );

      const tempFilePath = path.join(os.tmpdir(), `gd_multi_${Date.now()}_${file.fileId}`);
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      let secureFile;
      try {
        secureFile = await runSecurityPipeline(
          tempFilePath,
          fileMetadata.data.name || file.fileName || "untitled",
          fileMetadata.data.mimeType || file.mimeType,
          fileSize
        );
      } catch (secError) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error(secError.message);
      }

      const secureStream = fs.createReadStream(secureFile.path);

      const uploadResult = await uploadStreamToCloudinary(
        secureStream,
        secureFile.originalname,
        secureFile.mimetype
      );

      if (fs.existsSync(secureFile.path)) fs.unlinkSync(secureFile.path);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      results.push({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        filename: uploadResult.original_filename,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        size: uploadResult.bytes,
        sourceFileId: file.fileId,
      });
    } catch (error) {
      errors.push({ fileId: file.fileId, fileName: file.fileName, error: error.message });
    }
  }

  return res.status(200).json({
    success: true,
    uploaded: results,
    errors: errors.length > 0 ? errors : undefined,
    totalUploaded: results.length,
    totalFailed: errors.length,
  });
});
