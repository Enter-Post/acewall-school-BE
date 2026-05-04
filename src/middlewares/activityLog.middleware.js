import { logApiCall, logError } from "../services/activityLog.service.js";

/**
 * Request Logging Middleware
 * Logs all API requests with method, route, status code, and response time
 */

// Routes to exclude from logging (static files, health checks, frequent cron jobs, etc.)
const EXCLUDED_ROUTES = [
  "/uploads/",
  "/api/api-docs",
  "/favicon.ico",
  "/api/logs", // Don't log the logging endpoint itself
];

// Patterns to exclude (frequently running APIs like notifications, cron jobs)
const EXCLUDED_PATTERNS = [
  /^\/api\/notification/, // Notifications API - frequently polled
  /^\/api\/zoom\/monitor/, // Zoom monitoring endpoints
  /^\/api\/cron/, // Any cron job endpoints
  /^\/health/, // Health check endpoints
];

// Check if route should be excluded
const shouldExcludeRoute = (path) => {
  // Check static exclusions
  if (EXCLUDED_ROUTES.some((route) => path.startsWith(route))) {
    return true;
  }
  // Check pattern exclusions (cron jobs, notifications, etc.)
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(path))) {
    return true;
  }
  return false;
};

/**
 * Middleware to track API requests
 * Captures: method, route, userId, status code, response time, IP, user agent
 */
export const requestLogger = (req, res, next) => {
  // Skip excluded routes
  if (shouldExcludeRoute(req.path)) {
    return next();
  }

  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override res.end to capture response data
  res.end = function (chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    res.end(chunk, encoding);

    const responseTime = Date.now() - startTime;
    const userId = req.user?._id || req.user?.id || null;

    // Log the API call (fire and forget)
    logApiCall({
      method: req.method,
      route: req.originalUrl || req.url,
      userId,
      statusCode: res.statusCode,
      responseTime,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"],
      metadata: {
        query: sanitizeQuery(req.query),
        params: req.params,
        contentLength: res.getHeader("content-length"),
      },
    }).catch((err) => {
      // Silent fail - don't break the app if logging fails
      console.error("[RequestLogger] Failed to log request:", err.message);
    });
  };

  next();
};

/**
 * Error logging middleware
 * Captures and logs all errors
 */
export const errorLogger = (err, req, res, next) => {
  const userId = req.user?._id || req.user?.id || null;

  // Log the error (fire and forget)
  logError({
    event: "api_error",
    userId,
    message: err.message,
    stack: err.stack,
    metadata: {
      method: req.method,
      route: req.originalUrl || req.url,
      statusCode: err.status || err.statusCode || 500,
      ipAddress: getClientIp(req),
      body: sanitizeBody(req.body),
    },
  }).catch((logErr) => {
    console.error("[ErrorLogger] Failed to log error:", logErr.message);
  });

  // Pass to next error handler
  next(err);
};

/**
 * Extract client IP address from request
 * Handles proxies and various header formats
 */
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];

  // Helper to check if IP is localhost
  const isLocalhost = (ip) => {
    if (!ip) return true;
    return ip === "::1" ||
           ip === "127.0.0.1" ||
           ip === "localhost" ||
           ip.startsWith("::ffff:127.0.0.1") ||
           ip.startsWith("127.") ||
           ip === "0:0:0:0:0:0:0:1";
  };

  // Try X-Forwarded-For first (common proxy header)
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
    // We want the first non-localhost IP (the original client)
    const ips = forwarded.split(",").map(ip => ip.trim());
    for (const ip of ips) {
      if (!isLocalhost(ip)) {
        return ip;
      }
    }
    // If all are localhost, return the first one
    return ips[0];
  }

  // Try X-Real-IP (NGINX, etc.)
  if (realIp && !isLocalhost(realIp)) {
    return realIp;
  }

  // Get IP from request
  const reqIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;

  // If localhost, check if there's a forwarded IP in other headers
  if (isLocalhost(reqIp)) {
    // Try additional headers
    const cfIp = req.headers["cf-connecting-ip"]; // Cloudflare
    const trueClientIp = req.headers["true-client-ip"]; // Akamai, etc.

    if (cfIp && !isLocalhost(cfIp)) return cfIp;
    if (trueClientIp && !isLocalhost(trueClientIp)) return trueClientIp;
  }

  return reqIp || "unknown";
};

/**
 * Sanitize query parameters to remove sensitive data
 */
const sanitizeQuery = (query) => {
  if (!query || typeof query !== "object") return {};

  const sensitiveFields = ["password", "token", "secret", "apiKey"];
  const sanitized = { ...query };

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Sanitize request body to remove sensitive data before logging
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return {};

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "creditCard",
    "ssn",
    "apiKey",
    "currentPassword",
    "newPassword",
    "confirmPassword",
  ];

  const sanitized = {};

  Object.keys(body).forEach((key) => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof body[key] === "object" && body[key] !== null) {
      sanitized[key] = sanitizeBody(body[key]);
    } else {
      sanitized[key] = body[key];
    }
  });

  return sanitized;
};

/**
 * Middleware to attach user info from JWT to request
 * This runs before requestLogger to ensure userId is captured
 */
export const attachUserContext = (req, res, next) => {
  // If user is already attached by auth middleware, skip
  if (req.user) {
    return next();
  }

  // Try to extract user info from JWT if available
  const token =
    req.cookies?.client_jwt ||
    req.cookies?.admin_jwt ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.substring(7)
      : null);

  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRAT);
      req.user = decoded.user || decoded;
    } catch (err) {
      // Invalid token, continue without user
    }
  }

  next();
};

export default {
  requestLogger,
  errorLogger,
  attachUserContext,
};
