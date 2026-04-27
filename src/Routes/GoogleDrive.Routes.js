import express from "express";
import {
  getGoogleDriveAuthUrl,
  handleGoogleDriveCallback,
  checkDriveConnectionStatus,
  disconnectGoogleDrive,
} from "../Contollers/googleDrive.controller.js";
import {
  uploadFromGoogleDrive,
  getGoogleDrivePickerToken,
  uploadMultipleFromGoogleDrive,
} from "../Contollers/googleDriveUpload.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

router.get("/auth-url", isUser, getGoogleDriveAuthUrl);
router.get("/callback", handleGoogleDriveCallback);
router.get("/status", isUser, checkDriveConnectionStatus);
router.post("/disconnect", isUser, disconnectGoogleDrive);
router.post("/upload", isUser, uploadFromGoogleDrive);
router.post("/upload-multiple", isUser, uploadMultipleFromGoogleDrive);
router.get("/picker-token", isUser, getGoogleDrivePickerToken);

export default router;
