import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../Models/user.model.js";
import { getSamlProviderConfig, extractSamlProfile } from "../config/saml.config.js";
import { generateToken } from "../Utiles/jwtToken.js";
import { trackLogin } from "../Utiles/businessLogger.js";

const JWT_SECRET = process.env.JWT_SECRAT || process.env.JWT_SECRET || "your-secret-key";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5050";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// State parameter secret (separate from JWT secret for security)
const STATE_SECRET = process.env.STATE_SECRET || crypto.randomBytes(32).toString("hex");

// Temporary state store for SAML flow (in-memory, auto-expires)
const stateStore = new Map();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a signed state token containing role and provider
 * @param {string} role - user role (teacher/student)
 * @param {string} provider - SAML provider
 * @returns {string} state token
 */
const generateStateToken = (role, provider) => {
  const stateId = crypto.randomBytes(16).toString("hex");
  const stateData = {
    id: stateId,
    role,
    provider,
    createdAt: Date.now(),
    expiresAt: Date.now() + STATE_EXPIRY_MS,
  };
  
  // Store in memory
  stateStore.set(stateId, stateData);
  
  // Auto-cleanup after expiry
  setTimeout(() => {
    stateStore.delete(stateId);
  }, STATE_EXPIRY_MS);
  
  // Sign the state ID for verification
  return jwt.sign({ id: stateId }, STATE_SECRET, { expiresIn: "10m" });
};

/**
 * Verify and extract state token
 * @param {string} stateToken - the state parameter
 * @returns {object|null} state data or null if invalid
 */
const verifyStateToken = (stateToken) => {
  try {
    const decoded = jwt.verify(stateToken, STATE_SECRET);
    const stateData = stateStore.get(decoded.id);
    
    if (!stateData || stateData.expiresAt < Date.now()) {
      stateStore.delete(decoded.id);
      return null;
    }
    
    // Clean up after successful use (one-time use)
    stateStore.delete(decoded.id);
    
    return stateData;
  } catch (err) {
    console.error("State token verification failed:", err.message);
    return null;
  }
};

/**
 * @desc    Initialize SAML SSO flow - generate state token
 * @route   POST /api/auth/saml/init/:provider
 * @access  Public
 */
export const samlInit = async (req, res) => {
  try {
    const { provider } = req.params;
    const { role } = req.body;

    // Validate provider
    const config = getSamlProviderConfig(provider);
    if (!config) {
      return res.status(400).json({
        success: false,
        message: `SAML provider '${provider}' is not configured or missing required settings`,
      });
    }

    // Validate role - must be teacher or student for SSO
    const validRoles = ["teacher", "student"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'teacher' or 'student'",
      });
    }

    // Generate state token containing role and provider
    const stateToken = generateStateToken(role, provider);
    
    console.log(`✅ SAML init: role=${role}, provider=${provider}, state generated`);

    // Redirect to SAML login endpoint with state parameter
    return res.status(200).json({
      success: true,
      message: "SSO flow initialized",
      redirectUrl: `${BASE_URL}/api/auth/saml/login/${provider}?state=${stateToken}`,
    });
  } catch (error) {
    console.error("SAML Init Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize SAML SSO",
      error: error.message,
    });
  }
};

/**
 * @desc    Redirect to SAML Identity Provider
 * @route   GET /api/auth/saml/login/:provider
 * @access  Public
 */
export const samlLogin = (req, res, next) => {
  try {
    const { provider } = req.params;
    const { state } = req.query;

    // Check if provider is configured
    const config = getSamlProviderConfig(provider);
    if (!config) {
      return res.status(400).json({
        success: false,
        message: `SAML provider '${provider}' is not configured`,
      });
    }

    // Verify state token
    const stateData = verifyStateToken(state);
    if (!stateData) {
      console.error(`❌ Invalid or expired state token`);
      return res.status(400).json({
        success: false,
        message: "SSO session expired or invalid. Please restart the login flow.",
      });
    }

    // Validate provider matches
    if (stateData.provider !== provider) {
      console.error(`❌ Provider mismatch: expected ${stateData.provider}, got ${provider}`);
      return res.status(400).json({
        success: false,
        message: "Invalid SSO request. Provider mismatch.",
      });
    }

    console.log(`🔐 SAML login redirect to ${provider} with role=${stateData.role}`);

    // Store state data in session for callback (or use RelayState)
    req.session.samlStateData = stateData;

    // Trigger passport-saml authentication with state as RelayState
    passport.authenticate(`saml-${provider}`, {
      failureRedirect: `${FRONTEND_URL}/login?error=saml_failed`,
      failureFlash: true,
    })(req, res, next);
  } catch (error) {
    console.error("SAML Login Error:", error);
    return res.redirect(`${FRONTEND_URL}/login?error=saml_error`);
  }
};

/**
 * @desc    Handle SAML callback from Identity Provider
 * @route   POST /api/auth/saml/callback
 * @access  Public
 * 
 * CRITICAL: Role is determined from state data, NOT from SAML attributes
 * This ensures users cannot manipulate their role during SSO
 */
export const samlCallback = async (req, res) => {
  try {
    // Get state data from session (stored during /saml/login)
    const stateData = req.session?.samlStateData;
    
    // Fallback: check if provider is in state data
    const provider = stateData?.provider || "okta";
    
    console.log(`📥 SAML callback received (provider: ${provider})`);

    // Security: Verify state data has required role
    const selectedRole = stateData?.role;

    // Check if state data has role - CRITICAL SECURITY CHECK
    if (!selectedRole) {
      console.error("❌ SAML callback: Missing role in state data - possible direct callback attempt");
      return res.redirect(`${FRONTEND_URL}/login?error=session_expired`);
    }

    // Check state age (max 10 minutes for SSO flow)
    if (stateData?.createdAt) {
      const stateAge = Date.now() - stateData.createdAt;
      const maxAge = 10 * 60 * 1000; // 10 minutes
      if (stateAge > maxAge) {
        console.error(`❌ SAML callback: State expired (${Math.round(stateAge / 1000)}s old)`);
        return res.redirect(`${FRONTEND_URL}/login?error=session_expired`);
      }
    }

    // Extract user data from SAML response (passport-saml attaches to req.user)
    const samlProfile = req.user;

    // Validate SAML profile
    if (!samlProfile) {
      console.error("❌ SAML callback: Missing profile from passport-saml");
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_saml_response`);
    }

    if (!samlProfile.email) {
      console.error("❌ SAML callback: Missing email in SAML response");
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_saml_response`);
    }

    console.log(`✅ SAML authenticated: ${samlProfile.email}`);

    // Find existing user by email (case-insensitive)
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${samlProfile.email}$`, 'i') } 
    });

    console.log("user: in callabck😷🤡🥶😡😇😇🥳 ", user)

    if (user) {
      // ========================================================================
      // EXISTING USER - CRITICAL: DO NOT UPDATE ROLE (Security Requirement)
      // ========================================================================
      console.log(`👤 Existing user found: ${user.email}, role: ${user.role} (preserved)`);

      // Update SAML metadata only if not already set (link SAML to existing account)
      if (!user.samlId) {
        user.samlId = samlProfile.samlId;
        user.samlProvider = provider;
        user.authProvider = "saml"; // Update auth provider to SAML
        await user.save();
        console.log(`🔗 Linked SAML to existing user: ${user.email}`);
      }

      // Track login for existing user
      trackLogin(user._id, req, { loginMethod: "saml", provider });
    } else {
      // ========================================================================
      // NEW USER - Create with role FROM SESSION ONLY (NEVER from SAML)
      // ========================================================================
      console.log(`🆕 Creating new user: ${samlProfile.email}, role: ${selectedRole}`);

      // Extract name from SAML attributes
      const nameParts = samlProfile.displayName?.split(" ") || ["", ""];
      const firstName = samlProfile.firstName || nameParts[0] || "";
      const lastName = samlProfile.lastName || nameParts.slice(1).join(" ") || "";

      user = new User({
        email: samlProfile.email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: selectedRole, // FROM SESSION ONLY - NOT from SAML
        authProvider: "saml",
        samlId: samlProfile.samlId,
        samlProvider: provider,
        password: null, // No password for SSO users
        isEmailVerified: true, // SAML users are pre-verified by IdP
      });

      await user.save();
      console.log(`✅ New user created: ${user.email} with role: ${selectedRole}`);

      // Track login for new user
      trackLogin(user._id, req, { loginMethod: "saml", provider, isNewUser: true });
    }

    // Generate JWT token
     const token = generateToken(user, user.role, req, res);
     
    console.log("tokennnnnnnnnnnnnnnnnn", token)

    // const token = jwt.sign(tokenPayload, JWT_SECRET, {
    //   expiresIn: JWT_EXPIRES_IN,
    // });

    // ========================================================================
    // SESSION SECURITY: Clear session data to prevent replay attacks
    // ========================================================================
    req.session.samlStateData = null;
    
    // Regenerate session ID for security (prevents session fixation)
    const oldSessionID = req.sessionID;
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          console.error("❌ Session regeneration failed:", err);
          reject(err);
        } else {
          console.log(`🔄 Session regenerated: ${oldSessionID} → ${req.sessionID}`);
          resolve();
        }
      });
    });

    // Save cleared session before redirect
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // ========================================================================
    // DASHBOARD REDIRECTION: Based on user's actual role (not session role)
    // ========================================================================
    let dashboardPath;
    if (user.role === "teacher") {
      dashboardPath = "/teacher/";
    } else if (user.role === "student") {
      dashboardPath = "/student/";
    } else {
      // Fallback for unexpected roles
      console.warn(`⚠️ Unknown role '${user.role}', defaulting to student dashboard`);
      dashboardPath = "/student/";
    }

    console.log(`✅ SAML login complete: ${user.email}, redirecting to ${FRONTEND_URL}${dashboardPath}`);

    // For dev environments with cross-domain (ngrok -> localhost), pass token in URL
    // Production uses HTTP-only cookies for security
    const isDev = process.env.NODE_ENV !== "production";
    const redirectUrl = isDev 
      ? `${FRONTEND_URL}${dashboardPath}?auth_token=${token}`
      : `${FRONTEND_URL}${dashboardPath}`;

    if (!isDev) {
      // Set HTTP-only cookie with token (production only)
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    }

    // Redirect to frontend dashboard
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ SAML Callback Error:", error);
    return res.redirect(`${FRONTEND_URL}/login?error=saml_callback_failed`);
  }
};

/**
 * @desc    Get available SAML providers
 * @route   GET /api/auth/saml/providers
 * @access  Public
 */
export const getSamlProviders = async (req, res) => {
  try {
    const { getAvailableProviders } = await import("../config/saml.config.js");
    const providers = getAvailableProviders();

    return res.status(200).json({
      success: true,
      providers: providers.map((p) => ({
        name: p,
        displayName: p.charAt(0).toUpperCase() + p.slice(1),
      })),
    });
  } catch (error) {
    console.error("Get SAML Providers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get SAML providers",
    });
  }
};

/**
 * @desc    Handle SAML errors
 * @route   GET /api/auth/saml/error
 * @access  Public
 */
export const samlError = (req, res) => {
  const { error } = req.query;
  console.error("SAML Error handler:", error);

  return res.redirect(`${FRONTEND_URL}/login?error=${error || "saml_unknown"}`);
};

/**
 * Middleware to handle passport.authenticate callback
 */
export const samlAuthenticateMiddleware = (provider) => {
  return (req, res, next) => {
    passport.authenticate(`saml-${provider}`, (err, user, info) => {
      if (err) {
        console.error("SAML Authentication Error:", err);
        return res.redirect(`${FRONTEND_URL}/login?error=saml_auth_failed`);
      }

      if (!user) {
        console.error("SAML Authentication Failed:", info);
        return res.redirect(`${FRONTEND_URL}/login?error=saml_auth_denied`);
      }

      // Attach user to request for callback handler
      req.user = user;
      next();
    })(req, res, next);
  };
};

export default {
  samlInit,
  samlLogin,
  samlCallback,
  getSamlProviders,
  samlError,
  samlAuthenticateMiddleware,
};
