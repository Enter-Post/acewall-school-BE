import crypto from "crypto";
import { jwtVerify, createRemoteJWKSet, importSPKI } from "jose";
import LTIPlatform from "../Models/LTIPlatfrom.model.js";
import LTIState from "../Models/LTIState.model.js";
import { generateToken } from "../Utiles/jwtToken.js";
import User from "../Models/user.model.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import jwkToPem from "jwk-to-pem";
import fs from "fs"

export const ltiLogin = async (req, res) => {
  try {
    const {
      iss,
      login_hint,
      target_link_uri,
      lti_message_hint,
      lti_deployment_id,
    } = req.body;

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

    const isUserExists = await User.findOne({ "ltiUser.LTI_id": payload.sub });

    if (!isUserExists) {
      // Check if user exists by email (may have been created via other means)
      const userByEmail = await User.findOne({ email: payload.email });

      if (userByEmail) {
        // Update existing user with LTI info
        userByEmail.ltiUser = { LTI_id: payload.sub };
        if (isInstructor) userByEmail.role = "teacher";
        await userByEmail.save();
        user = userByEmail;
      } else {
        // Create new user
        user = new User({
          firstName: payload.name,
          email: payload.email,
          ltiUser: {
            LTI_id: payload.sub,
          },
          role: isInstructor ? "teacher" : "student",
        });
        await user.save();
      }
    } else {
      user = isUserExists;
    }

    console.log("launch_presentation:", payload["https://purl.imsglobal.org/spec/lti/claim/launch_presentation"])

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

    return res.redirect(`${FRONTEND_URL}?token=${token}`);
    // return res.redirect(`${payload["https://purl.imsglobal.org/spec/lti/claim/launch_presentation"].return_url}`);

    // return res.send(`
    //   <html>
    //     <body>
    //       <script>
    //         window.top.location.href = "${FRONTEND_URL}?token=${token}";
    //       </script>
    //     </body>
    //   </html>
    // `);
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

export const deeplinking = async (req, res) => {
  try {
    const id_token = req.body.JWT || req.body.id_token;

    if (!id_token) {
      return res.status(400).send("Missing LTI JWT");
    }

    // STEP 2: Decode WITHOUT verifying first (to read iss)
    const decodedHeader = jwt.decode(id_token, { complete: true });
    const payload = decodedHeader.payload;

    const roles =
      payload[
      "https://purl.imsglobal.org/spec/lti/claim/roles"
      ] || [];

    console.log("roles: ", roles)
    const isInstructor = roles.includes(
      "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"
    );

    console.log("isInstructor:", isInstructor)

    const issuer = payload.iss;

    const platform = await LTIPlatform.findOne({ issuer });

    if (!platform) {
      return res.status(400).send("Unknown platform");
    }

    // console.log("platform: ", platform)

    // STEP 3: Get platform JWKS (for verification)
    // const jwksUrl = `${issuer}/.well-known/jwks.json`;

    // console.log("jwksUrl:", jwksUrl)

    // console.log("payload:", payload)

    // const jwksResponse = await axios.get(jwksUrl);
    // const jwks = jwksResponse.data.keys;

    // const kid = decodedHeader.header.kid;

    // const key = jwks.find(k => k.kid === kid);
    // if (!key) {
    //   return res.status(401).send("Invalid signing key");
    // }

    // const publicKey = jwkToPem(key);

    // STEP 4: Verify JWT
    const verified = jwt.verify(id_token, platform.public_key, {
      algorithms: ["RS256"]
    });

    let user;

    const isUserExists = await User.findOne({ "ltiUser.LTI_id": payload.sub });

    if (!isUserExists) {
      // Check if user exists by email (may have been created via other means)
      const userByEmail = await User.findOne({ email: payload.email });

      if (userByEmail) {
        // Update existing user with LTI info
        userByEmail.ltiUser = { LTI_id: payload.sub };
        if (isInstructor) userByEmail.role = "teacher";
        await userByEmail.save();
        user = userByEmail;
      } else {
        // Create new user
        user = new User({
          firstName: payload.name,
          email: payload.email,
          ltiUser: {
            LTI_id: payload.sub,
          },
          role: isInstructor ? "teacher" : "student",
        });
        await user.save();
      }
    } else {
      user = isUserExists;
    }

    const token = generateToken(
      user,
      isInstructor ? "teacher" : "student",
      req,
      res,
      payload["https://purl.imsglobal.org/spec/lti/claim/message_type"] === "LtiDeepLinkingRequest"
    );


    // STEP 5: Check if it's Deep Linking request
    const messageType =
      verified["https://purl.imsglobal.org/spec/lti/claim/message_type"];

    if (messageType !== "LtiDeepLinkingRequest") {
      return res.status(400).send("Not a Deep Linking request");
    }

    // STEP 6: Extract return URL
    const dl =
      verified["https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings"];

    const returnUrl = dl.deep_link_return_url;

    const context = payload["https://purl.imsglobal.org/spec/lti/claim/context"]

    const getParentOrigin = (url) => {
      try {
        return new URL(url).origin;
      } catch {
        return "";
      }
    };

    const frontendUrl =
      `http://localhost:5173` +
      `?returnUrl=${encodeURIComponent(returnUrl)}` +
      `&contextId=${payload.context?.id || ""}` +
      `&token=${token}` +
      `&message_hint=${encodeURIComponent(dl.data || "")}` +
      `&lti_context=true` +
      `&parent_origin=${encodeURIComponent(getParentOrigin(returnUrl))}`;

    return res.redirect(frontendUrl)

    // STEP 7: Show UI (simple example HTML)
    return res.send(`
      <html>
        <body>
          <h2>Select Content</h2>

          <form method="POST" action="/api/lti/deep-linking/submit">
            <input type="hidden" name="returnUrl" value="${returnUrl}" />

            <button name="item" value="course_1">Math Course</button>
            <button name="item" value="quiz_1">Quiz 1</button>
          </form>
        </body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Deep linking error");
  }
};

export const deeplinkingSubmit = async (req, res) => {
  try {
    const { item, returnUrl,
      contentItems
    } = req.body;

    // STEP 1: Build content item
    // const contentItems = [
    //   {
    //     type: "ltiResourceLink",
    //     title: item === "course_1" ? "Talha's course" : "Quiz 1",
    //     url: `https://hehehehehheh.com/lti/launch?resource=${item}`
    //   }
    // ];

    // STEP 2: Build JWT payload
    const payload = {
      iss: "my-test-client-id",
      aud: "my-test-client-id",
      exp: Math.floor(Date.now() / 1000) + 300,

      "https://purl.imsglobal.org/spec/lti/claim/message_type":
        "LtiDeepLinkingResponse",

      "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",

      "https://purl.imsglobal.org/spec/lti-dl/claim/content_items":
        contentItems
    };


    const privateKey = fs.readFileSync("./keys/private.key", "utf8");

    // STEP 3: Sign JWT (use your private key)
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      keyid: process.env.KID
    });

    // STEP 4: Send back to LMS via auto-submit form
    res.send(`
<html>
  <body>
    <form id="dlForm" method="POST" action="${returnUrl}" target="_top">
      <input type="hidden" name="JWT" value="${token}" />
    </form>

    <script>
      // try auto submit
      document.getElementById("dlForm").submit();

      // fallback in case browser blocks it
      setTimeout(() => {
        window.location.href = "${returnUrl}";
      }, 1000);
    </script>
  </body>
</html>
`);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Deep linking error");
  }
};