import rateLimit from "express-rate-limit";

/**
 * Rate limiter for login endpoint
 * Allows 7 login attempts per minute per IP address
 * After exceeding the limit, user must wait 30 seconds
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 7, // Limit each IP to 7 requests per windowMs
  message: {
    error: true,
    message: "Too many login attempts. Please try again after 30 seconds.",
    retryAfter: 30,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful login requests
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      message: "Too many login attempts. Please try again after 30 seconds.",
      retryAfter: 30,
    });
  },
});
