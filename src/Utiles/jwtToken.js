import jwt from "jsonwebtoken";
import { getUserPermissions } from "../middlewares/rbac.middleware.js";
import mongoose from "mongoose";

export const generateToken = (
  user,
  role,
  req,
  res,
  deepLinkSupport = false,
  options = { setCookie: true, expiresIn: "1d", purpose: "auth" }
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

  // ----------------- Calculate permissions based on role -----------------
  const userRole = role || user.role;
  const permissions = getUserPermissions(userRole);

  // ----------------- Clean user object -----------------
  const safeUser = {
    _id: user._id,
    email: user.email,
    role: userRole,
    name: user.name,
    profileImg: user.profileImg,
    deepLinkSupport: deepLinkSupport || false,
    // BCPS RBAC additions
    districtId: new mongoose.Types.ObjectId(user.districtId) || null,
    schoolId: new mongoose.Types.ObjectId(user.schoolId) || "",
    permissions: permissions,
    authProvider: user.authProvider || "local",
  };

  // ----------------- Sign JWT -----------------
  const token = jwt.sign(
    {
      user: safeUser,
      deepLinkSupport,
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

    const cookieResult = res.cookie(cookieName, token, {
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