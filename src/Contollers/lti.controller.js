import crypto from "crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";
import LTIPlatform from "../Models/LTIPlatfrom.model.js";
import mongoose from "mongoose";

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

    const specificPlatform = await LTIPlatform.findOne({ issuer: iss, active: true });

    if (!specificPlatform) {
      return res.status(400).send("Platform not registered");
    }

    // 🔐 Generate state & nonce
    const state = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    req.session.ltiState = state;
    req.session.ltiNonce = nonce;

    console.log("req.session.ltiState in login:", req.session.ltiState)
    console.log("req.session.ltiNonce in login:", req.session.ltiNonce)

    // 🔁 Redirect to platform authorization endpoint
    const redirectUrl = new URL(specificPlatform.authorization_endpoint);

    redirectUrl.searchParams.set("response_type", "id_token");
    redirectUrl.searchParams.set("client_id", specificPlatform.client_id);
    redirectUrl.searchParams.set("redirect_uri", specificPlatform.redirect_uri);
    redirectUrl.searchParams.set("scope", "openid");
    redirectUrl.searchParams.set("state", state);
    redirectUrl.searchParams.set("response_mode", "form_post");
    redirectUrl.searchParams.set("nonce", nonce);
    redirectUrl.searchParams.set("login_hint", login_hint);

    if (lti_message_hint) {
      redirectUrl.searchParams.set("lti_message_hint", lti_message_hint);
    }

    // console.log("redirectUrl:", redirectUrl)

    return res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error("LTI Login Error:", err);
    res.status(500).send("Login failed");
  }
};

export const ltiLaunch = async (req, res) => {
  try {
    const { id_token, state } = req.body;

    // console.log("id_token in launch:", id_token)
    // console.log("state in launch:", state)

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

    console.log(platform, "platform in the launch")

    // 🔐 Verify JWT using platform JWKS
    const JWKS = createRemoteJWKSet(new URL(platform.jwks_url));

    const { payload } = await jwtVerify(id_token, JWKS, {
      issuer: platform.issuer,
      audience: platform.client_id,
    });

    console.log("req.session.ltiState in launch: ", req.session.ltiState)
    console.log("req.session.ltiNonce in launch: ", req.session.ltiNonce)

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

export const createPlatform = async (req, res) => {
  try {
    const { platform_name, issuer, client_id, jwks_url, active, redirect_uri, deployment_id, authorization_endpoint, token_endpoint } = req.body;
    const platform = new LTIPlatform({
      platform_name,
      issuer,
      client_id,
      jwks_url,
      active,
      redirect_uri,
      deployment_id,
      authorization_endpoint,
      token_endpoint
    });
    await platform.save();
    res.status(201).json({ platform, message: "Platform created successfully" });
  } catch (err) {
    console.error("Create Platform Error:", err);
    res.status(500).send("Create platform failed");
  }
};