import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
import fs from "fs"; // you won't need it now but you can keep it if you delete temp files elsewhere

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { fileTypeFromBuffer } from 'file-type';

export const uploadToCloudinary = async (fileBuffer, folder = "", resourceType = null) => {
  try {
    // Hardening: Strict resource_type detection from magic bytes
    let finalResourceType = "raw"; // Default safest
    let isPdf = false;
    if (resourceType) {
      finalResourceType = resourceType;
    } else {
      const type = await fileTypeFromBuffer(fileBuffer);
      console.log("type", type)
      if (type) {
        if (type.mime.startsWith('image/')) {
          finalResourceType = 'image';
        } else if (type.mime.startsWith('video/')) {
          finalResourceType = 'video';
        } else if (type.mime === 'application/pdf') {
          finalResourceType = 'raw';
          isPdf = true;
        }
      }
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: finalResourceType,
          // If it's a raw file, Cloudinary will force Content-Disposition attachment, preventing XSS
          format: isPdf ? "pdf" : undefined // raw ignores format conversions anyway
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};
