import crypto from "crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";
import LTIPlatform from "../Models/LTIPlatfrom.model.js";

export const ltiLogin = async (req, res) => {
  try {
    const {
      iss,
      login_hint,
      target_link_uri,
      lti_message_hint,
    } = req.query;

    if (!iss || !login_hint || !target_link_uri) {
      return res.status(400).send("Missing required params");
    }

    // 🔍 Find platform
    const platform = await LTIPlatform.findOne({ issuer: iss, active: true });
    if (!platform) {
      return res.status(400).send("Platform not registered");
    }

    // 🔐 Generate state & nonce
    const state = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    // (store these in session or DB for validation later)
    req.session.ltiState = state;
    req.session.ltiNonce = nonce;

    // 🔁 Redirect to platform authorization endpoint
    const redirectUrl = new URL(platform.authorization_endpoint);

    redirectUrl.searchParams.set("response_type", "id_token");
    redirectUrl.searchParams.set("client_id", platform.client_id);
    redirectUrl.searchParams.set("redirect_uri", platform.redirect_uri);
    redirectUrl.searchParams.set("scope", "openid");
    redirectUrl.searchParams.set("state", state);
    redirectUrl.searchParams.set("response_mode", "form_post");
    redirectUrl.searchParams.set("nonce", nonce);
    redirectUrl.searchParams.set("login_hint", login_hint);

    if (lti_message_hint) {
      redirectUrl.searchParams.set("lti_message_hint", lti_message_hint);
    }

    return res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error("LTI Login Error:", err);
    res.status(500).send("Login failed");
  }
};

export const ltiLaunch = async (req, res) => {
  try {
    const { id_token, state } = req.body;

    if (!id_token) {
      return res.status(400).send("Missing id_token");
    }

    // 🧠 Decode WITHOUT verifying (to get issuer)
    const decoded = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64").toString()
    );

    const iss = decoded.iss;

    // 🔍 Find platform
    const platform = await LTIPlatform.findOne({ issuer: iss, active: true });
    if (!platform) {
      return res.status(400).send("Unknown platform");
    }

    // 🔐 Verify JWT using platform JWKS
    const JWKS = createRemoteJWKSet(new URL(platform.jwks_url));

    const { payload } = await jwtVerify(id_token, JWKS, {
      issuer: platform.issuer,
      audience: platform.client_id,
    });

    // ✅ Validate state & nonce
    if (state !== req.session.ltiState) {
      return res.status(400).send("Invalid state");
    }

    if (payload.nonce !== req.session.ltiNonce) {
      return res.status(400).send("Invalid nonce");
    }

    // 👤 Extract user info
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };

    // 📚 Extract course/context
    const context = payload["https://purl.imsglobal.org/spec/lti/claim/context"];

    // 🎭 Roles
    const roles = payload["https://purl.imsglobal.org/spec/lti/claim/roles"];

    // 👉 Create session (your LMS login)
    req.session.user = user;

    console.log("LTI Launch Success:", { user, context, roles });

    // 🚀 Redirect to your LMS dashboard/course
    return res.redirect("/dashboard");

  } catch (err) {
    console.error("LTI Launch Error:", err);
    res.status(500).send("Launch failed");
  }
};