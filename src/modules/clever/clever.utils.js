import crypto from "crypto";

export const CLEVER_CONFIG = {
  clientId: process.env.CLEVER_CLIENT_ID || "871d9af11c27cf50d287",
  clientSecret: process.env.CLEVER_CLIENT_SECRET,
  redirectUri:
    process.env.CLEVER_REDIRECT_URI ||
    "https://yourdomain.com/api/auth/clever/callback",
  districtId: process.env.CLEVER_DISTRICT_ID || "693b25a02c74c38af2134cd6",
  authUrl: "https://clever.com/oauth/authorize",
  tokenUrl: "https://clever.com/oauth/tokens",
  apiUrl: "https://api.clever.com/v3.0",
};

export const ROLE_MAPPING = {
  student: "student",
  teacher: "instructor",
  district_admin: "admin",
  school_admin: "admin",
};

/**
 * Generate a random secure string for state parameter
 */
export const generateState = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Handle fetch responses and errors
 */
export const handleFetchResponse = async (response, context) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`Clever API Error [${context}]:`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(
      `Clever API Error: ${errorData.error || response.statusText}`,
    );
  }
  return response.json();
};

/**
 * Implementation of timeout for fetch using AbortController
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
