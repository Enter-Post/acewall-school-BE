import crypto from "crypto";
import { jwtVerify, createRemoteJWKSet, importSPKI } from "jose";
import LTIPlatform from "../Models/LTIPlatfrom.model.js";
import LTIState from "../Models/LTIState.model.js";
import { generateToken } from "../Utiles/jwtToken.js";
import User from "../Models/user.model.js";

export const ltiLogin = async (req, res) => {
  try {
    const {
      iss,
      login_hint,
      target_link_uri,
      lti_message_hint,
      lti_deployment_id,
    } = req.body;

    // console.log("req.body: ", req.body);
    console.log("Login hitted")

    if (!iss || !login_hint || !target_link_uri) {
      return res.status(400).send("Missing required params");
    }

    const platform = await LTIPlatform.findOne({
      issuer: iss,
      active: true,
    });

    if (!platform) {
      return res.status(400).send("Platform not registered");
    }

    // 🔐 Generate state & nonce
    const state = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    // 💾 STORE IN DB instead of session
    await LTIState.create({
      state,
      nonce,
    });

    console.log("Stored state in DB:", state);
    console.log("Stored nonce in DB:", nonce);

    // 🔁 Build redirect URL
    const redirectUrl = new URL(platform.authorization_endpoint);

    redirectUrl.searchParams.set("response_type", "id_token");
    redirectUrl.searchParams.set("client_id", platform.client_id);

    redirectUrl.searchParams.set(
      "redirect_uri",
      platform.redirect_uris?.[0]
    );

    redirectUrl.searchParams.set("scope", "openid");
    redirectUrl.searchParams.set("state", state);
    redirectUrl.searchParams.set("nonce", nonce);
    redirectUrl.searchParams.set("response_mode", "form_post");

    redirectUrl.searchParams.set("login_hint", login_hint);
    redirectUrl.searchParams.set("target_link_uri", target_link_uri);

    redirectUrl.searchParams.set("prompt", "none");

    if (lti_message_hint) {
      redirectUrl.searchParams.set("lti_message_hint", lti_message_hint);
    }

    console.log("redirectUrl:", redirectUrl.toString());

    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("LTI Login Error:", err);
    res.status(500).send("Login failed");
  }
};

export const ltiLaunch = async (req, res) => {
  try {
    const { id_token, state } = req.body;

    console.log("id_token: ", id_token)
    console.log("state: ", state)

    if (!id_token) {
      return res.status(400).send("Missing id_token");
    }

    // 🔐 Decode safely (base64url fix)
    const decoded = JSON.parse(
      Buffer.from(id_token.split(".")[1], "base64url").toString()
    );

    const iss = decoded.iss;

    const platform = await LTIPlatform.findOne({
      issuer: iss,
      active: true,
    });

    if (!platform) {
      return res.status(400).send("Unknown platform");
    }

    const publicKey = await importSPKI(platform.public_key, "RS256");

    // 🔑 JWKS verification
    const JWKS = createRemoteJWKSet(new URL(platform.jwks_url));

    const { payload } = await jwtVerify(id_token, publicKey, {
      issuer: platform.issuer,
      audience: platform.client_id,
    });

    const stored = await LTIState.findOne({ state });

    if (!stored) {
      return res.status(400).send("Invalid or expired state");
    }

    if (payload.nonce !== stored.nonce) {
      return res.status(400).send("Invalid nonce");
    }

    // 🔒 Deployment validation (IMPORTANT)
    const deploymentId =
      payload[
      "https://purl.imsglobal.org/spec/lti/claim/deployment_id"
      ];

    if (
      platform.deployments.length &&
      !platform.deployments.includes(deploymentId)
    ) {
      return res.status(400).send("Invalid deployment");
    }

    // 📦 Message type check
    const messageType =
      payload[
      "https://purl.imsglobal.org/spec/lti/claim/message_type"
      ];

    if (messageType !== "LtiResourceLinkRequest") {
      return res.status(400).send("Invalid message type");
    }

    // 👤 User info
    // const user = {
    //   id: payload.sub,
    //   name: payload.name,
    //   email: payload.email,
    // };

    // 🎭 Roles
    const roles =
      payload[
      "https://purl.imsglobal.org/spec/lti/claim/roles"
      ] || [];

    const isInstructor = roles.includes(
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
    );

    console.log("payload.sub in launch:", payload.sub);

    let user;

    const isUserExists = await User.findOne({ ltiUser: { LTI_id: payload.sub } });

    if (!isUserExists) {
      // Create user
      user = new User({
        firstName: payload.name,
        email: payload.email,
        ltiUser: {
          LTI_id: payload.sub,
        },
        role: isInstructor ? "teacher" : "student",
      });
      await user.save();
    } else {
      user = isUserExists;
    }

    // 🔐 your app token
    const token = generateToken(
      user,
      isInstructor ? "teacher" : "student",
      req,
      res
    );

    // 🚀 redirect to frontend
    const FRONTEND_URL =
      process.env.FRONTEND_URL || "http://localhost:5173";

    return res.send(`
      <html>
        <body>
          <script>
            window.top.location.href = "${FRONTEND_URL}?token=${token}";
          </script>
        </body>
      </html>
    `);
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