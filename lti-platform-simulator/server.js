import express from "express";
import { SignJWT, importPKCS8 } from "jose";
import crypto from "crypto";

const app = express();
const PORT = 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONFIG
const LMS_URL = "http://localhost:5050";
const PLATFORM_ISSUER = "http://localhost:4000";

const PLATFORM_CONFIG = {
  issuer: PLATFORM_ISSUER,
  client_id: "lti-tool-client-id",
  authorization_endpoint: `${PLATFORM_ISSUER}/authorize`,
  jwks_url: `${PLATFORM_ISSUER}/.well-known/jwks.json`,
  redirect_uri: `${LMS_URL}/api/lti/launch`,
  deployment_id: "test-deployment-1",
};

// KEYS
let privateKey;
let jwks;

async function generateKeys() {
  const { publicKey, privateKey: pk } = await crypto.generateKeyPairSync(
    "rsa",
    {
      modulusLength: 2048,
    }
  );

  const privatePem = pk.export({ type: "pkcs8", format: "pem" });
  privateKey = await importPKCS8(privatePem.toString(), "RS256");

  const pub = publicKey.export({ format: "jwk" });

  jwks = {
    keys: [
      {
        ...pub,
        kid: crypto.randomUUID(),
        alg: "RS256",
        use: "sig",
      },
    ],
  };
}

// JWKS
app.get("/.well-known/jwks.json", (req, res) => {
  res.json(jwks);
});

// AUTHORIZE (🔥 FIXED — NO AXIOS)
app.get("/authorize", async (req, res) => {
  const { client_id, redirect_uri, state, nonce } = req.query;

  const idToken = await generateIdToken({
    iss: PLATFORM_CONFIG.issuer,
    aud: client_id,
    nonce,
    state,
  });

  // ✅ REAL LTI BEHAVIOR (FORM POST)
  res.send(`
    <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${redirect_uri}">
          <input type="hidden" name="id_token" value="${idToken}" />
          <input type="hidden" name="state" value="${state}" />
        </form>
      </body>
    </html>
  `);
});

// GENERATE TOKEN
async function generateIdToken({ iss, aud, nonce, state }) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss,
    sub: "user-123",
    aud,
    exp: now + 3600,
    iat: now,
    nonce,
    state,
    name: "Test User",
    email: "test@example.com",

    "https://purl.imsglobal.org/spec/lti/claim/deployment_id":
      PLATFORM_CONFIG.deployment_id,
    "https://purl.imsglobal.org/spec/lti/claim/message_type":
      "LtiResourceLinkRequest",
    "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
    "https://purl.imsglobal.org/spec/lti/claim/context": {
      id: "course-123",
    },
    "https://purl.imsglobal.org/spec/lti/claim/roles": [
      "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
    ],
    "https://purl.imsglobal.org/spec/lti/claim/target_link_uri":
      PLATFORM_CONFIG.redirect_uri,
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: jwks.keys[0].kid })
    .sign(privateKey);
}

// START FLOW
app.get("/simulate-launch", (req, res) => {
  const params = new URLSearchParams({
    iss: PLATFORM_CONFIG.issuer,
    login_hint: "test-user",
    target_link_uri: PLATFORM_CONFIG.redirect_uri,
  });

  res.redirect(`${LMS_URL}/api/lti/login?${params}`);
});

async function start() {
  await generateKeys();

  app.listen(PORT, () => {
    console.log(`🚀 Platform running: http://localhost:${PORT}`);
    console.log(`👉 Test: http://localhost:${PORT}/simulate-launch`);
  });
}

start();