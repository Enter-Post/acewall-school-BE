import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { 
  generateKeyPair, 
  exportJWK, 
  importPKCS8,
  SignJWT,
  jwtVerify,
  createRemoteJWKSet 
} from 'jose';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Configuration
// ==========================================
const CONFIG = {
  clientId: process.env.CLIENT_ID || 'lti-tool-client-id',
  toolUrl: process.env.TOOL_URL || `http://localhost:${PORT}`,
  redirectUri: process.env.REDIRECT_URI || `http://localhost:${PORT}/launch`,
  platform: {
    issuer: process.env.PLATFORM_ISSUER,
    authUrl: process.env.PLATFORM_AUTH_URL,
    tokenUrl: process.env.PLATFORM_TOKEN_URL,
    jwksUrl: process.env.PLATFORM_JWKS_URL
  },
  sessionSecret: process.env.SESSION_SECRET || 'lti-session-secret-change-in-production'
};

// In-memory storage for state/nonce validation
const stateStore = new Map();
const nonceStore = new Set();

// Key storage
let keyPair = null;
let jwks = null;

// ==========================================
// Middleware
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: CONFIG.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 3600000 // 1 hour
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// Key Management
// ==========================================
async function initializeKeys() {
  try {
    // Check if keys should be loaded from files
    if (process.env.PRIVATE_KEY_PATH && process.env.PUBLIC_KEY_PATH) {
      // TODO: Implement file-based key loading
      console.log('File-based keys not yet implemented, generating new keys...');
    }
    
    // Generate new RSA key pair
    keyPair = await generateKeyPair('RS256', { modulusLength: 2048 });
    
    // Export public key as JWK
    const publicJWK = await exportJWK(keyPair.publicKey);
    
    // Build JWKS
    jwks = {
      keys: [{
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: crypto.randomUUID(),
        n: publicJWK.n,
        e: publicJWK.e
      }]
    };
    
    console.log('✅ RSA key pair generated successfully');
    console.log(`🔑 Key ID (kid): ${jwks.keys[0].kid}`);
  } catch (error) {
    console.error('❌ Key generation failed:', error);
    process.exit(1);
  }
}

// ==========================================
// JWKS Endpoint
// ==========================================
app.get('/.well-known/jwks.json', (req, res) => {
  console.log('📡 JWKS endpoint called');
  
  if (!jwks) {
    return res.status(500).json({ error: 'Keys not initialized' });
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.json(jwks);
});

// ==========================================
// OIDC Login Endpoint
// ==========================================
app.get('/login', (req, res) => {
  try {
    const { 
      iss, 
      login_hint, 
      target_link_uri, 
      lti_message_hint,
      lti_deployment_id 
    } = req.query;
    
    console.log('\n📥 LOGIN REQUEST RECEIVED');
    console.log('================================');
    console.log('iss:', iss);
    console.log('login_hint:', login_hint);
    console.log('target_link_uri:', target_link_uri);
    console.log('lti_message_hint:', lti_message_hint);
    console.log('lti_deployment_id:', lti_deployment_id);
    console.log('================================\n');
    
    // Validate required parameters
    if (!iss || !login_hint || !target_link_uri) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Missing required parameters: iss, login_hint, target_link_uri'
      });
    }
    
    // Generate state and nonce
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Store for validation
    const stateData = {
      iss,
      nonce,
      target_link_uri,
      timestamp: Date.now()
    };
    
    stateStore.set(state, stateData);
    nonceStore.add(nonce);
    
    // Store in session for additional security
    req.session.lti = {
      state,
      nonce,
      iss,
      target_link_uri
    };
    
    // Build authorization request
    const authParams = new URLSearchParams({
      client_id: CONFIG.clientId,
      redirect_uri: CONFIG.redirectUri,
      response_type: 'id_token',
      scope: 'openid',
      login_hint,
      nonce,
      state,
      prompt: 'none',
      response_mode: 'form_post'
    });
    
    // Add optional parameters
    if (target_link_uri) {
      authParams.set('target_link_uri', target_link_uri);
    }
    
    if (lti_message_hint) {
      authParams.set('lti_message_hint', lti_message_hint);
    }
    
    // Determine authorization endpoint
    let authUrl = CONFIG.platform.authUrl;
    
    // If platform URLs not configured, try to construct from issuer
    if (!authUrl && iss) {
      authUrl = `${iss}/authorizations/new`;
    }
    
    if (!authUrl) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Platform authorization URL not configured'
      });
    }
    
    const redirectUrl = `${authUrl}?${authParams.toString()}`;
    
    console.log('📤 REDIRECTING TO PLATFORM');
    console.log('================================');
    console.log('URL:', authUrl);
    console.log('Parameters:');
    for (const [key, value] of authParams) {
      if (key !== 'login_hint') {
        console.log(`  ${key}: ${value}`);
      } else {
        console.log(`  ${key}: [REDACTED]`);
      }
    }
    console.log('================================\n');
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// ==========================================
// LTI Launch Endpoint
// ==========================================
app.post('/launch', async (req, res) => {
  try {
    const { id_token, state } = req.body;
    
    console.log('\n🚀 LAUNCH REQUEST RECEIVED');
    console.log('================================');
    console.log('state:', state);
    console.log('id_token present:', !!id_token);
    console.log('================================\n');
    console.log("cookies:", req.headers.cookie);
    // Validate required parameters
    if (!id_token) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Missing id_token'
      });
    }
    
    if (!state) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing state parameter'
      });
    }
    
    // Validate state
    const storedState = stateStore.get(state);
    const sessionState = req.session.lti;
    
    if (!storedState && !sessionState) {
      return res.status(400).json({
        error: 'Invalid State',
        message: 'State parameter validation failed'
      });
    }
    
    // Clear state to prevent replay attacks
    stateStore.delete(state);
    
    // Decode token header to get key ID
    const tokenParts = id_token.split('.');
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    console.log('\n📋 DECODED JWT HEADER');
    console.log('================================');
    console.log(JSON.stringify(header, null, 2));
    console.log('================================\n');
    
    console.log('📋 DECODED JWT PAYLOAD (UNVERIFIED)');
    console.log('================================');
    console.log(JSON.stringify(payload, null, 2));
    console.log('================================\n');
    
    // Validate nonce
    const nonce = payload.nonce;
    const expectedNonce = storedState?.nonce || sessionState?.nonce;
    
    if (!nonce || nonce !== expectedNonce) {
      console.error('❌ Nonce mismatch');
      console.log('Received:', nonce);
      console.log('Expected:', expectedNonce);
      return res.status(400).json({
        error: 'Invalid Nonce',
        message: 'Nonce validation failed'
      });
    }
    
    nonceStore.delete(nonce);
    
    // Verify JWT signature using platform JWKS
    let verifiedPayload;
    try {
      const jwksUrl = CONFIG.platform.jwksUrl || 
        (payload.iss ? `${payload.iss}/platform_keyset.json` : null);
      
      if (!jwksUrl) {
        throw new Error('Platform JWKS URL not configured');
      }
      
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      
      const { payload: verified } = await jwtVerify(id_token, JWKS, {
        issuer: payload.iss,
        audience: CONFIG.clientId
      });
      
      verifiedPayload = verified;
      console.log('✅ JWT signature verified successfully');
      
    } catch (verifyError) {
      console.error('❌ JWT verification failed:', verifyError.message);
      return res.status(401).json({
        error: 'Unauthorized',
        message: `JWT verification failed: ${verifyError.message}`
      });
    }
    
    // Extract LTI claims
    const ltiClaims = {
      sub: verifiedPayload.sub,
      name: verifiedPayload.name,
      email: verifiedPayload.email,
      given_name: verifiedPayload.given_name,
      family_name: verifiedPayload.family_name,
      picture: verifiedPayload.picture,
      roles: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
      context: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/context'],
      resource_link: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/resource_link'],
      launch_presentation: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/launch_presentation'],
      message_type: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/message_type'],
      version: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/version'],
      deployment_id: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
      target_link_uri: verifiedPayload['https://purl.imsglobal.org/spec/lti/claim/target_link_uri']
    };
    
    console.log('\n✅ LTI LAUNCH SUCCESSFUL');
    console.log('================================');
    console.log('User:', ltiClaims.name, `(${ltiClaims.email || 'no email'})`);
    console.log('Subject:', ltiClaims.sub);
    console.log('Roles:', ltiClaims.roles.join(', '));
    console.log('Context:', ltiClaims.context?.title || 'N/A');
    console.log('Message Type:', ltiClaims.message_type);
    console.log('================================\n');
    
    // Store launch data in session
    req.session.user = ltiClaims;
    
    // Return HTML response showing user info
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LTI 1.3 Tool Launch Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              color: #22c55e;
              border-bottom: 2px solid #22c55e;
              padding-bottom: 10px;
            }
            .section {
              margin: 20px 0;
            }
            .label {
              font-weight: 600;
              color: #374151;
            }
            .value {
              color: #6b7280;
              margin-left: 10px;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              margin: 2px;
            }
            .role-instructor { background: #dbeafe; color: #1e40af; }
            .role-learner { background: #dcfce7; color: #166534; }
            .role-admin { background: #fee2e2; color: #991b1b; }
            .json-box {
              background: #1f2937;
              color: #e5e7eb;
              padding: 15px;
              border-radius: 6px;
              overflow-x: auto;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 12px;
            }
            .success-banner {
              background: #dcfce7;
              border: 1px solid #22c55e;
              color: #166534;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-banner">
              ✅ LTI 1.3 Launch Successful! JWT verified and claims extracted.
            </div>
            
            <h1>Welcome, ${ltiClaims.name || 'User'}!</h1>
            
            <div class="section">
              <h3>User Information</h3>
              <div><span class="label">Subject ID:</span><span class="value">${ltiClaims.sub}</span></div>
              <div><span class="label">Name:</span><span class="value">${ltiClaims.name || 'N/A'}</span></div>
              <div><span class="label">Email:</span><span class="value">${ltiClaims.email || 'N/A'}</span></div>
              ${ltiClaims.given_name ? `<div><span class="label">Given Name:</span><span class="value">${ltiClaims.given_name}</span></div>` : ''}
              ${ltiClaims.family_name ? `<div><span class="label">Family Name:</span><span class="value">${ltiClaims.family_name}</span></div>` : ''}
            </div>
            
            <div class="section">
              <h3>LTI Roles</h3>
              ${ltiClaims.roles.map(role => {
                const roleName = role.split('#').pop() || role.split('/').pop();
                let cssClass = 'role-learner';
                if (role.includes('Instructor')) cssClass = 'role-instructor';
                if (role.includes('Administrator')) cssClass = 'role-admin';
                return `<span class="badge ${cssClass}">${roleName}</span>`;
              }).join('') || '<span class="value">No roles provided</span>'}
            </div>
            
            <div class="section">
              <h3>Context</h3>
              <div><span class="label">Context ID:</span><span class="value">${ltiClaims.context?.id || 'N/A'}</span></div>
              <div><span class="label">Context Type:</span><span class="value">${ltiClaims.context?.type?.join(', ') || 'N/A'}</span></div>
              <div><span class="label">Context Title:</span><span class="value">${ltiClaims.context?.title || 'N/A'}</span></div>
              <div><span class="label">Context Label:</span><span class="value">${ltiClaims.context?.label || 'N/A'}</span></div>
            </div>
            
            <div class="section">
              <h3>Resource Link</h3>
              <div><span class="label">Resource ID:</span><span class="value">${ltiClaims.resource_link?.id || 'N/A'}</span></div>
              <div><span class="label">Resource Title:</span><span class="value">${ltiClaims.resource_link?.title || 'N/A'}</span></div>
              <div><span class="label">Resource Description:</span><span class="value">${ltiClaims.resource_link?.description || 'N/A'}</span></div>
            </div>
            
            <div class="section">
              <h3>LTI Details</h3>
              <div><span class="label">Message Type:</span><span class="value">${ltiClaims.message_type || 'N/A'}</span></div>
              <div><span class="label">LTI Version:</span><span class="value">${ltiClaims.version || 'N/A'}</span></div>
              <div><span class="label">Deployment ID:</span><span class="value">${ltiClaims.deployment_id || 'N/A'}</span></div>
              <div><span class="label">Target Link URI:</span><span class="value">${ltiClaims.target_link_uri || 'N/A'}</span></div>
            </div>
            
            <div class="section">
              <h3>Full JWT Payload</h3>
              <pre class="json-box">${JSON.stringify(verifiedPayload, null, 2)}</pre>
            </div>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Launch error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// ==========================================
// OAuth2 Token Endpoint
// ==========================================
app.post('/token', async (req, res) => {
  try {
    const { 
      grant_type, 
      client_assertion_type, 
      client_assertion,
      scope 
    } = req.body;
    
    console.log('\n🔑 TOKEN REQUEST RECEIVED');
    console.log('================================');
    console.log('grant_type:', grant_type);
    console.log('client_assertion_type:', client_assertion_type);
    console.log('scope:', scope);
    console.log('client_assertion present:', !!client_assertion);
    console.log('================================\n');
    
    // Validate grant type
    if (grant_type !== 'client_credentials') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials is supported'
      });
    }
    
    // Validate client assertion type
    if (client_assertion_type !== 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer') {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Invalid client assertion type'
      });
    }
    
    if (!client_assertion) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing client_assertion'
      });
    }
    
    // Decode and validate client assertion JWT
    let assertionPayload;
    try {
      const tokenParts = client_assertion.split('.');
      assertionPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      console.log('📋 CLIENT ASSERTION PAYLOAD');
      console.log('================================');
      console.log(JSON.stringify(assertionPayload, null, 2));
      console.log('================================\n');
      
      // Validate client assertion claims
      if (assertionPayload.iss !== CONFIG.clientId) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid issuer in client assertion'
        });
      }
      
      if (assertionPayload.sub !== CONFIG.clientId) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid subject in client assertion'
        });
      }
      
      // Verify signature using our own JWKS (platform should verify this)
      // In production, the platform validates this against our JWKS
      
    } catch (assertionError) {
      console.error('❌ Client assertion validation failed:', assertionError);
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client assertion'
      });
    }
    
    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresIn = 3600; // 1 hour
    
    console.log('✅ ACCESS TOKEN GENERATED');
    console.log('Token (first 16 chars):', accessToken.substring(0, 16) + '...');
    console.log('Expires in:', expiresIn, 'seconds\n');
    
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: scope || 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly'
    });
    
  } catch (error) {
    console.error('❌ Token endpoint error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: error.message
    });
  }
});

// ==========================================
// Health Check
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    toolUrl: CONFIG.toolUrl,
    jwksAvailable: !!jwks,
    clientId: CONFIG.clientId
  });
});

// ==========================================
// Configuration Endpoint (Optional)
// ==========================================
app.get('/.well-known/openid-configuration', (req, res) => {
  res.json({
    issuer: CONFIG.toolUrl,
    token_endpoint: `${CONFIG.toolUrl}/token`,
    jwks_uri: `${CONFIG.toolUrl}/.well-known/jwks.json`
  });
});

// ==========================================
// Error Handling
// ==========================================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ==========================================
// Server Startup
// ==========================================
async function start() {
  await initializeKeys();
  
  app.listen(PORT, () => {
    console.log('\n🚀 LTI 1.3 Tool Provider Running');
    console.log('================================');
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`JWKS:   http://localhost:${PORT}/.well-known/jwks.json`);
    console.log(`Login:  http://localhost:${PORT}/login`);
    console.log(`Launch: http://localhost:${PORT}/launch`);
    console.log(`Token:  http://localhost:${PORT}/token`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log('================================');
    console.log('\n📚 Register this tool with your platform using:');
    console.log(`   Target Link URI: ${CONFIG.redirectUri}`);
    console.log(`   Login URL:       ${CONFIG.toolUrl}/login`);
    console.log(`   JWKS URL:        ${CONFIG.toolUrl}/.well-known/jwks.json`);
    console.log('================================\n');
    
    if (!CONFIG.platform.issuer) {
      console.log('⚠️  Warning: Platform issuer not configured in .env');
      console.log('   Set PLATFORM_ISSUER and other platform URLs\n');
    }
  });
}

start();
