import passport from "passport";
import { Strategy as SamlStrategy } from "passport-saml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * SAML Configuration for Multiple Identity Providers
 * Currently supports: Okta, Azure AD (extensible)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5050";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Helper to load certificate from file or env var
const loadCertificate = (filePath, envVar) => {
  try {
    // Try file first
    const absolutePath = path.resolve(__dirname, "../../", filePath);
    if (fs.existsSync(absolutePath)) {
      return fs.readFileSync(absolutePath, "utf-8");
    }
  } catch (err) {
    // Silent fail - will try env var next
  }

  // Fallback to env var
  if (envVar && process.env[envVar]) {
    return process.env[envVar];
  }

  return null;
};

// Load certificates
const oktaCert = loadCertificate("certs/okta.pem", "SAML_OKTA_CERT");
const azureCert = loadCertificate("certs/azure.pem", "SAML_AZURE_CERT");


/**
 * SAML Provider Configurations
 * 
 * SP (Service Provider) = YOUR application
 * IdP (Identity Provider) = Okta/Azure AD
 * 
 * SINGLE CALLBACK ROUTE: /api/auth/saml/callback
 * This route handles ALL providers via session tracking
 */
const samlProviders = {
  okta: {
    // SP Configuration (Your App)
    issuer: process.env.SAML_OKTA_ISSUER || BASE_URL,  // Audience URI in Okta
    callbackUrl: `${BASE_URL}/api/auth/saml/callback`, // ACS URL in Okta (SINGLE ROUTE)

    // IdP Configuration (Okta)
    entryPoint: process.env.SAML_OKTA_ENTRY_POINT,     // Okta SSO URL
    idpIssuer: process.env.SAML_OKTA_IDP_ISSUER,       // http://www.okta.com/{app-id}
    cert: oktaCert,                                     // Okta X.509 Certificate (file or env)

    // Security Settings
    privateKey: process.env.SAML_PRIVATE_KEY || null,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    acceptedClockSkewMs: 60000, // 1 minute clock skew tolerance
    validateInResponseTo: true,
    wantAuthnResponseSigned: true,
    disableRequestedAuthnContext: false,
  },
  azure: {
    // SP Configuration (Your App)
    issuer: process.env.SAML_AZURE_ISSUER || BASE_URL,
    callbackUrl: `${BASE_URL}/api/auth/saml/callback`, // SINGLE ROUTE

    // IdP Configuration (Azure AD)
    entryPoint: process.env.SAML_AZURE_ENTRY_POINT,
    idpIssuer: process.env.SAML_AZURE_IDP_ISSUER,
    cert: azureCert,                                    // Azure X.509 Certificate (file or env)

    // Security Settings
    privateKey: process.env.SAML_PRIVATE_KEY || null,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
    acceptedClockSkewMs: 60000,
    validateInResponseTo: true,
    wantAuthnResponseSigned: true,
    disableRequestedAuthnContext: false,
  },
};


/**
 * Get active SAML provider configuration
 * @param {string} provider - Provider name (okta, azure)
 * @returns {object|null} Provider config or null if not configured
 */
export const getSamlProviderConfig = (provider) => {
  const config = samlProviders[provider.toLowerCase()];
  if (!config) return null;

  // Check if required fields are present
  if (!config.entryPoint || !config.cert) {
    return null;
  }

  return config;
};

/**
 * Extract user profile from SAML response
 * @param {object} profile - SAML profile from passport-saml
 * @returns {object} Normalized user data
 */
export const extractSamlProfile = (profile) => {
  if (!profile) {
    throw new Error("SAML profile is missing");
  }

  // Extract email - try multiple sources
  const email =
    profile.nameID ||
    profile.email ||
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    profile["urn:oid:0.9.2342.19200300.100.1.3"] ||
    null;

  if (!email) {
    throw new Error("Email not found in SAML response");
  }

  // Extract name - try multiple attribute formats
  const firstName =
    profile.firstName ||
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] ||
    profile["urn:oid:2.5.4.42"] ||
    "";

  const lastName =
    profile.lastName ||
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] ||
    profile["urn:oid:2.5.4.4"] ||
    "";

  // Full name fallback
  const displayName =
    profile.displayName ||
    profile["http://schemas.microsoft.com/identity/claims/displayname"] ||
    `${firstName} ${lastName}`.trim();

  // SAML NameID for future reference
  const samlId =
    profile.nameID ||
    profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    email;

  return {
    email: email.toLowerCase().trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    displayName: displayName.trim(),
    samlId: samlId.trim(),
  };
};

/**
 * Initialize Passport SAML Strategy
 */
export const initializeSamlStrategy = () => {
  // Register strategy for each configured provider
  Object.keys(samlProviders).forEach((provider) => {
    const config = getSamlProviderConfig(provider);
    if (!config) return;

    const strategyConfig = {
      // SP (Your App) Settings
      issuer: config.issuer,
      callbackUrl: config.callbackUrl,
      privateKey: config.privateKey,
      
      // IdP (Okta/Azure) Settings
      entryPoint: config.entryPoint,
      cert: config.cert,
      
      // Security Settings
      signatureAlgorithm: config.signatureAlgorithm,
      digestAlgorithm: config.digestAlgorithm,
      identifierFormat: config.identifierFormat,
      acceptedClockSkewMs: config.acceptedClockSkewMs,
      validateInResponseTo: config.validateInResponseTo,
      wantAuthnResponseSigned: config.wantAuthnResponseSigned,
      disableRequestedAuthnContext: config.disableRequestedAuthnContext,
    };

    passport.use(
      `saml-${provider}`,
      new SamlStrategy(strategyConfig, (profile, done) => {
        try {
          const userData = extractSamlProfile(profile);
          // Attach provider info
          userData.provider = provider;
          return done(null, userData);
        } catch (error) {
          return done(error, null);
        }
      })
    );

    // Strategy registered silently
  });

  // Serialize user for session (minimal data)
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, email: user.email, role: user.role });
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

/**
 * Get available SAML providers
 * @returns {array} List of configured providers
 */
export const getAvailableProviders = () => {
  return Object.keys(samlProviders).filter(
    (provider) => getSamlProviderConfig(provider) !== null
  );
};

export default {
  getSamlProviderConfig,
  extractSamlProfile,
  initializeSamlStrategy,
  getAvailableProviders,
};
