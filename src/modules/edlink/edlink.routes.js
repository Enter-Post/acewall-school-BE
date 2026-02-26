import express from "express";
import {
  redirectToEdlink,
  handleCallback,
  syncRoster,
  getStatus,
} from "./edlink.controller.js";

const router = express.Router();

/**
 * @route   GET /api/edlink/connect
 * @desc    Redirect school admin to Edlink for authorization
 */
router.get("/connect", redirectToEdlink);

/**
 * @route   GET /api/edlink/status
 * @desc    Check if Edlink is connected for the school
 */
router.get("/status", getStatus);

/**
 * @route   GET /api/edlink/callback
 * @desc    Handle Edlink OAuth callback, exchange code, and store tokens
 */
router.get("/callback", handleCallback);

/**
 * @route   POST /api/edlink/sync
 * @desc    Manually trigger a roster sync (Teacher/Admin only)
 * Note: Add your auth middleware here in a real scenario
 */
router.post("/sync", syncRoster);

export default router;
