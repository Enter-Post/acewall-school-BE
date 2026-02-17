import { CLEVER_CONFIG, generateState } from "./clever.utils.js";
import CleverService from "./clever.service.js";
import { generateToken } from "../../Utiles/jwtToken.js";

export const login = (req, res) => {
  const state = generateState();

  // Store state in a cookie for validation (secure, httpOnly)
  res.cookie("clever_auth_state", state, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLEVER_CONFIG.clientId,
    redirect_uri: CLEVER_CONFIG.redirectUri,
    state,
  });

  const url = `${CLEVER_CONFIG.authUrl}?${params.toString()}`;
  res.redirect(url);
};

export const instantLogin = (req, res) => {
  const params = new URLSearchParams({
    client_id: CLEVER_CONFIG.clientId,
    district_id: CLEVER_CONFIG.districtId,
  });

  const url = `https://clever.com/oauth/instant-login?${params.toString()}`;
  res.redirect(url);
};

export const callback = async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies?.clever_auth_state;

  try {
    if (error) {
      console.error("Clever Auth Error:", error);
      return res.status(400).json({
        success: false,
        message: `Clever authentication failed: ${error}`,
        errorCode: "CLEVER_OAUTH_ERROR",
      });
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing code or state",
        errorCode: "CLEVER_INVALID_REQUEST",
      });
    }

    // Validate state
    if (!storedState || state !== storedState) {
      return res.status(403).json({
        success: false,
        message: "Invalid state parameter",
        errorCode: "CLEVER_STATE_MISMATCH",
      });
    }

    // Clear state cookie
    res.clearCookie("clever_auth_state");

    // 1. Exchange code for token
    const tokenData = await CleverService.exchangeCodeForToken(code);
    const accessToken = tokenData.access_token;

    // 2. Fetch user identity
    const identity = await CleverService.getUserProfile(accessToken);
    const { data: userData } = identity;

    // 3. Fetch full details (optional but recommended for name/email/schools)
    const details = await CleverService.getUserDetails(
      accessToken,
      userData.type,
      userData.id,
    );

    // Combine data
    const fullUserData = {
      ...userData,
      ...details.data,
      id: userData.id, // Ensure we use the correct ID
    };

    // 4. Sync/Create user in DB
    const user = await CleverService.processCleverUser(fullUserData);

    // 5. Generate LMS JWT and set cookie
    // generateToken sets the cookie based on req host (admin or client)
    generateToken(user, user.role, req, res);

    // 6. Redirect to portal
    const isDev = process.env.NODE_ENV === "development";
    let baseUrl =
      user.role === "admin"
        ? process.env.ADMIN_URL ||
          "https://admin.acewallscholarslearningonline.com"
        : process.env.CLIENT_URL || "https://acewallscholarslearningonline.com";

    // If a specific success redirect is provided in ENV, use it
    const redirectPath = process.env.CLEVER_SUCCESS_PATH || "/dashboard";
    const finalRedirectUrl = `${baseUrl}${redirectPath}`;

    res.redirect(finalRedirectUrl);
  } catch (err) {
    console.error("Clever Callback Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Clever authentication failed",
      errorCode: "CLEVER_OAUTH_ERROR",
    });
  }
};
