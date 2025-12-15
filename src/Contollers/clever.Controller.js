import axios from "axios";
import User from "../Models/user.model.js";
import { generateToken } from "../Utiles/jwtToken.js";

export const cleverCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    // STEP 1 — Exchange code for access token
    const tokenResponse = await axios.post(
      "https://clever.com/oauth/tokens",
      {
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.CLEVER_REDIRECT_URI
      },
      {
        headers: {
          Authorization:
            `Basic ${Buffer
              .from(`${process.env.CLEVER_CLIENT_ID}:${process.env.CLEVER_CLIENT_SECRET}`)
              .toString("base64")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // STEP 2 — Get user identity
    const userResponse = await axios.get("https://api.clever.com/v3.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const cleverData = userResponse.data.data;

    console.log("Clever User:", cleverData);

    // Extract needed info
    const email =
      cleverData?.email ||
      cleverData?.teacher?.email ||
      cleverData?.student?.email ||
      null;

    const firstName = cleverData?.name?.first || "Unknown";
    const lastName = cleverData?.name?.last || "User";

    const role = cleverData?.roles?.teacher ? "teacher" : "student";

    // STEP 3 — Check if user exists in LMS
    let user = await User.findOne({ cleverId: cleverData.id });

    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        cleverId: cleverData.id,
        role,
        password: Math.random().toString(36).slice(-10), // not used
      });
    }

    // STEP 4 — Generate LMS JWT login
    generateToken(user, user.role, req, res);

    // STEP 5 — Redirect user to frontend dashboard
    res.redirect(`${process.env.CLIENT_URL}/home`);

  } catch (error) {
    console.error("Clever SSO Error:", error.response?.data || error.message);
    res.status(500).send("Clever SSO Login Failed");
  }
};
