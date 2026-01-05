import jwt from "jsonwebtoken";

export const generateToken = (
  user,
  role,
  req,
  res,
  options = { setCookie: true, expiresIn: "7d", purpose: "auth" }
) => {

  // ----------------- Detect portal -----------------
  let host = "";
  const origin = req?.get?.("origin");

  if (origin) {
    try {
      host = new URL(origin).hostname;
    } catch { }
  }
  if (!host && req?.hostname) {
    host = req.hostname;
  }

  const portal = host && host.startsWith("admin.") ? "admin" : "client";
  const cookieName = portal === "admin" ? "admin_jwt" : "client_jwt";

  // ----------------- Clean user object -----------------
  const safeUser = {
    _id: user._id,
    email: user.email,
    role: role || user.role,
    name: user.name,
    profileImg: user.profileImg,
  };

  // ----------------- Sign JWT -----------------
  const token = jwt.sign(
    {
      user: safeUser,
      aud: portal,
      purpose: options.purpose, // 🔑 important
    },
    process.env.JWT_SECRAT,
    { expiresIn: options.expiresIn }
  );

  // ----------------- Set cookie ONLY if allowed -----------------
  if (options.setCookie) {
    if (!res || !res.cookie) {
      throw new Error("❌ Express `res` object missing");
    }

    res.cookie(cookieName, token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    console.log(`✅ Cookie [${cookieName}] set for ${portal}`);
  }

  return token;
};