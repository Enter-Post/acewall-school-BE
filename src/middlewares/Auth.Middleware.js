import jwt from "jsonwebtoken";
import User from "../Models/user.model.js";
// import Admin from "../Models/admins.model.js";   // Uncomment later if needed

// ----------------- Helper: detect portal -----------------
function getPortalFromReq(req) {
  let host = "";

  // Try Origin header first (browser fetch/AJAX usually sets this)
  const origin = req.get("origin");
  if (origin) {
    try {
      host = new URL(origin).hostname;
    } catch (err) {
      console.error("Invalid origin header:", origin);
    }
  }

  // Fallback to req.hostname (server-level detection)
  if (!host && req.hostname) {
    host = req.hostname;
  }

  // Default to client if still unknown
  if (!host) return "client";

  return host.startsWith("admin.") ? "admin" : "client";
}

export const isUser = async (req, res, next) => {
  try {
    // Try both cookies
    const adminToken = req.cookies?.admin_jwt;
    const clientToken = req.cookies?.client_jwt;
    const token = adminToken || clientToken;

    if (!token) {
      return res.status(401).json({
        error: true,
        message: "No auth token provided",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRAT);
    } catch (err) {
      return res.status(401).json({
        error: true,
        message: "Invalid or expired token",
      });
    }

    // Lookup user
    const user = await User.findById(decoded.userID).select("-password");
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    // Check role vs cookie type
    if (
      ["teacher", "student"].includes(user.role) &&
      !clientToken
    ) {
      return res.status(401).json({
        error: true,
        message: "Expected client_jwt but got admin_jwt",
      });
    }

    if (user.role === "admin" && !adminToken) {
      return res.status(401).json({
        error: true,
        message: "Expected admin_jwt but got client_jwt",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in isUser middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Authentication failed",
    });
  }
};
