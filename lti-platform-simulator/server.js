import express from 'express';
import { SignJWT, jwtVerify, createRemoteJWKSet, exportPKCS8, generateKeyPair, importPKCS8 } from 'jose';
import crypto from 'crypto';
import axios from 'axios';

const app = express();
const PORT = 4000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Store for session data (in production, use proper session store)
const sessionStore = new Map();

const loginUrl = 'https://professor-gallon-dropout.ngrok-free.dev/api/lti/login';

// LTI Platform Configuration
const PLATFORM_CONFIG = {
  issuer: 'http://localhost:4000',
  client_id: 'lti-tool-client-id',
  authorization_endpoint: 'http://localhost:4000/authorize',
  token_endpoint: 'http://localhost:4000/token',
  jwks_url: 'http://localhost:4000/.well-known/jwks.json',
  redirect_uri: 'https://professor-gallon-dropout.ngrok-free.dev/api/lti/launch',
  deployment_id: 'test-deployment-1'
};

// RSA Key Pair (in production, load from secure storage)
let privateKey, publicKey, jwks;

async function generateKeys() {
  // Generate RSA key pair
  const keyPair = await crypto.webcrypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  // Export private key as PEM string
  const privateKeyBuffer = await crypto.webcrypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyBase64 = Buffer.from(privateKeyBuffer).toString('base64');
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
  privateKey = await importPKCS8(privateKeyPem, 'RS256');

  // Export public key as JWK
  const publicKeyJWK = await crypto.webcrypto.subtle.exportKey('jwk', keyPair.publicKey);
  const kid = crypto.randomUUID();
  jwks = { 
    keys: [{ 
      ...publicKeyJWK, 
      kid: kid, 
      alg: 'RS256', 
      use: 'sig',
      kty: 'RSA'
    }] 
  };

  console.log('✅ RSA keys generated successfully');
  console.log('🔑 JWKS:', JSON.stringify(jwks, null, 2));
}

// JWKS Endpoint
app.get('/.well-known/jwks.json', (req, res) => {
  res.json(jwks);
});

// Authorization Endpoint (simulates platform auth)
app.get('/authorize', async (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state, nonce, login_hint, lti_message_hint } = req.query;

  console.log('🔐 Authorization Request:', { client_id, redirect_uri, state, nonce, login_hint });

  // Store state and nonce for validation
  const sessionId = crypto.randomUUID();
  sessionStore.set(sessionId, { state, nonce, login_hint, lti_message_hint });

  // Generate ID Token
  const idToken = await generateIdToken({
    iss: PLATFORM_CONFIG.issuer,
    sub: 'test-user-123',
    aud: client_id,
    nonce: nonce,
    state: state,
    login_hint: login_hint
  });

  // Send direct POST request to LMS launch endpoint
  console.log('📤 Sending POST to LMS:', redirect_uri);
  console.log('🔑 Generated ID Token length:', idToken.length);
  console.log('📍 State:', state);
  
  try {
    const response = await axios.post(redirect_uri, new URLSearchParams({
      id_token: idToken,
      state: state
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ LMS Launch Response:', response.status);
    console.log('� Response data:', response.data);
    
    // Return the LMS response to the browser
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LTI Launch Complete</title>
      </head>
      <body>
        <h2>🎉 LTI Launch Successful!</h2>
        <p><strong>Status:</strong> ${response.status}</p>
        <p><strong>Response:</strong></p>
        <pre>${JSON.stringify(response.data, null, 2)}</pre>
        <p><a href="${redirect_uri.replace('/launch', '/dashboard')}">Go to Dashboard</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ LMS Launch Error:', error.message);
    if (error.response) {
      console.error('📄 LMS Response:', error.response.status, error.response.data);
    }
    
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LTI Launch Failed</title>
      </head>
      <body>
        <h2>❌ LTI Launch Failed</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Status:</strong> ${error.response?.status || 'Unknown'}</p>
        <p><strong>Response:</strong></p>
        <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
      </body>
      </html>
    `);
  }
});

// Generate LTI 1.3 ID Token
async function generateIdToken({ iss, sub, aud, nonce, state, login_hint }) {
  const now = Math.floor(Date.now() / 1000);
  
  const claims = {
    iss: iss,
    sub: sub,
    aud: aud,
    exp: now + 3600, // 1 hour
    iat: now,
    nonce: nonce,
    name: 'Test User',
    email: 'test@example.com',
    
    // LTI 1.3 specific claims
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': PLATFORM_CONFIG.deployment_id,
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: 'course-123',
      label: 'Test Course',
      title: 'Introduction to Testing'
    },
    'https://purl.imsglobal.org/spec/lti/claim/roles': [
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'
    ],
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: 'resource-123',
      title: 'Test Resource'
    },
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': PLATFORM_CONFIG.redirect_uri,
    'https://purl.imsglobal.org/spec/lti/claim/custom': {
      'platform_instance': 'test-platform'
    }
  };

  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: jwks.keys[0].kid })
    .sign(privateKey);

  return jwt;
}

// Simulate Launch Endpoint
app.get('/simulate-launch', async (req, res) => {
  try {
    console.log('🎯 Starting LTI Launch Simulation...');
    
    // Generate state and nonce
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const login_hint = 'test-user';
    
    // Call LMS login endpoint
    const LMS_URL = 'https://professor-gallon-dropout.ngrok-free.dev/api/lti/login';
    const params = new URLSearchParams({
      iss: PLATFORM_CONFIG.issuer,
      login_hint: login_hint,
      target_link_uri: PLATFORM_CONFIG.redirect_uri,
      lti_message_hint: 'test-message'
    });

    console.log('📞 Calling LMS Login:', `${loginUrl}?${params.toString()}`);
    
    // Redirect to LMS login (this will trigger the flow)
    res.redirect(`${loginUrl}?${params.toString()}`);
    
  } catch (error) {
    console.error('❌ Simulation Error:', error);
    res.status(500).json({ error: 'Simulation failed', details: error.message });
  }
});

// Token Endpoint (for completeness)
app.post('/token', async (req, res) => {
  // This would normally exchange authorization code for access token
  // For LTI 1.3, we're using the implicit flow with id_token
  res.json({
    access_token: 'fake-access-token',
    token_type: 'Bearer',
    expires_in: 3600
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    platform: 'Fake LTI Platform Simulator',
    config: PLATFORM_CONFIG 
  });
});

// Start server
async function startServer() {
  await generateKeys();
  
  app.listen(PORT, () => {
    console.log(`🚀 Fake LTI Platform Simulator running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /simulate-launch     - Start LTI flow`);
    console.log(`   GET  /health             - Health check`);
    console.log(`   GET  /.well-known/jwks.json - JWKS endpoint`);
    console.log(`   GET  /authorize          - OAuth2 authorization`);
    console.log(`   POST /token              - OAuth2 token endpoint`);
    console.log(`\n🎯 To test: http://localhost:4000/simulate-launch`);
  });
}

startServer().catch(console.error);
