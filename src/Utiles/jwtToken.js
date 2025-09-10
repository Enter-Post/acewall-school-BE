import jwt from "jsonwebtoken";

export const generateToken = (userID, role, req, res) => {
  // ----------------- Detect portal -----------------
  let host = "";
  const origin = req.get("origin");

  if (origin) {
    try {
      host = new URL(origin).hostname;
    } catch (err) {
      console.error("Invalid origin header:", origin);
    }
  }
  if (!host && req.hostname) {
    host = req.hostname;
  }

  console.log(role, "role in the JWTTOKEN");

  const portal = (role === "teacher" || role === "student") ? "client" : "admin";

  console.log(portal, "portal in the JWTTOKEN");

  // ----------------- Cookie name based on portal -----------------
  const cookieName = portal === "admin" ? "admin_jwt" : "client_jwt";

  console.log(cookieName, "cookieName");

  // ----------------- Sign JWT -----------------
  const token = jwt.sign(
    { userID, role, aud: portal },
    process.env.JWT_SECRAT,
    { expiresIn: "7d" }
  );

  // ----------------- Cookie options -----------------
  const isProd = process.env.NODE_ENV === "production";

  if (!res || !res.cookie) {
    throw new Error("❌ Express `res` object not passed into generateToken");
  }

  res.cookie(cookieName, token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    // domain: ".domain.com", // enable if using subdomains
  });

  console.log(`✅ Cookie [${cookieName}] sent for portal: ${portal}`, {
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });

  return token;
};
