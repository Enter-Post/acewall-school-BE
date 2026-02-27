import edlinkService from "./edlink.service.js";
import crypto from "crypto";

/**
 * Controller to handle Edlink OAuth flow and Sync requests
 */
export const redirectToEdlink = (req, res) => {
  // Trim values to be absolutely sure no spaces exist
  const clientId = process.env.EDLINK_CLIENT_ID?.trim();
  const redirectUri = process.env.EDLINK_REDIRECT_URI?.trim();

  if (!clientId || clientId === "your_edlink_client_id") {
    return res
      .status(500)
      .json({ message: "Edlink Client ID is not configured correctly." });
  }

  // 1. Generate a robust random state
  const state = crypto.randomBytes(16).toString("hex");
  req.session.edlinkState = state;

  // 2. Use the native URL class for GUARANTEED correct encoding
  const authorizeUrl = new URL("https://ed.link/api/authentication/authorize");
  authorizeUrl.searchParams.append("client_id", clientId);
  authorizeUrl.searchParams.append("redirect_uri", redirectUri);
  authorizeUrl.searchParams.append("response_type", "code");
  authorizeUrl.searchParams.append("scope", "profile offline_access");
  authorizeUrl.searchParams.append("state", state);

  console.log("--- EDLINK FINAL DEBUG ---");
  console.log("Redirecting to:", authorizeUrl.toString());
  console.log("--------------------------");

  req.session.save((err) => {
    if (err) {
      console.error("Session save error:", err);
      return res.status(500).json({ message: "Session persistence error" });
    }
    res.redirect(authorizeUrl.toString());
  });
};

export const handleCallback = async (req, res) => {
  const { code, state } = req.query;

  // 🔹 Verify state
  if (!state || state !== req.session.edlinkState) {
    console.error(
      "State mismatch. Received:",
      state,
      "Expected:",
      req.session.edlinkState,
    );
    return res
      .status(400)
      .json({ message: "INVALID_STATE: State mismatch or missing" });
  }

  // 🔹 Remove state from session after use
  delete req.session.edlinkState;

  try {
    // Exchange code for tokens
    const tokenData = await edlinkService.exchangeCodeForTokens(code);
    await edlinkService.storeTokens(tokenData);

    // Redirect back to admin dashboard
    const frontendUrl =
      process.env.ADMIN_FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/admin/edlink?success=true`);
  } catch (err) {
    console.error("Edlink callback error:", err.message);
    res
      .status(500)
      .json({ message: "Failed to connect Edlink", error: err.message });
  }
};

export const syncRoster = async (req, res) => {
  try {
    const stats = await edlinkService.syncUsers();
    res.status(200).json({
      message: "Roster sync completed",
      stats,
    });
  } catch (error) {
    console.error("Edlink Sync Error:", error.message);
    res.status(500).json({ message: "Sync failed", error: error.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const school = await edlinkService.getSchoolConnection();
    const isConnected = !!school?.edlinkConnection?.accessToken;

    res.status(200).json({
      isConnected,
      lastSync: school?.updatedAt, // Using updatedAt as a proxy for last sync for now
      schoolName: school?.schoolname,
      edlinkConnection: isConnected
        ? {
            tokenExpiresAt: school.edlinkConnection.tokenExpiresAt,
          }
        : null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch status", error: error.message });
  }
};
