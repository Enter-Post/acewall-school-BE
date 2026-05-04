# LTI 1.3 Tool Provider

A minimal, production-correct LTI 1.3 Tool Provider implementation using Node.js and Express.

## Features

- ✅ OpenID Connect (OIDC) authentication flow
- ✅ RS256 JWT signing and verification
- ✅ JWKS endpoint for key discovery
- ✅ State and nonce validation
- ✅ OAuth2 client credentials token endpoint
- ✅ Comprehensive logging for debugging
- ✅ Production-ready security headers

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/jwks.json` | GET | JSON Web Key Set for signature verification |
| `/login` | GET | Initiates OIDC login flow |
| `/launch` | POST | Receives and validates LTI launch |
| `/token` | POST | OAuth2 client credentials token endpoint |
| `/health` | GET | Health check and configuration |
| `/.well-known/openid-configuration` | GET | OIDC configuration (optional) |

## Quick Start

### 1. Install Dependencies

```bash
# From the parent project (dependencies already installed):
npm install

# Or if running standalone:
npm install express express-session jose axios dotenv
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Server

```bash
node server.js
```

Server will start on `http://localhost:3000` (or PORT from .env).

## Testing with IMS LTI Reference Tool

### Step 1: Expose Local Server with ngrok

```bash
# Install ngrok if not already installed
npm install -g ngrok

# Expose your local server
ngrok http 3000
```

**Output:**
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Step 2: Configure Environment

Update your `.env` file:

```env
# Use your ngrok URL
TOOL_URL=https://abc123.ngrok-free.app
REDIRECT_URI=https://abc123.ngrok-free.app/launch

# IMS LTI Reference Implementation (RI) Platform
# Replace PLATFORM_ID with your actual platform ID from the RI
PLATFORM_ISSUER=https://lti-ri.imsglobal.org
PLATFORM_AUTH_URL=https://lti-ri.imsglobal.org/platforms/PLATFORM_ID/authorizations/new
PLATFORM_TOKEN_URL=https://lti-ri.imsglobal.org/platforms/PLATFORM_ID/access_tokens
PLATFORM_JWKS_URL=https://lti-ri.imsglobal.org/platforms/PLATFORM_ID/platform_keyset.json

CLIENT_ID=your-tool-client-id
```

### Step 3: Register Tool with IMS RI

1. Go to [https://lti-ri.imsglobal.org](https://lti-ri.imsglobal.org)
2. Create a new platform or use an existing one
3. Register your tool with these values:
   - **Target Link URI**: `https://abc123.ngrok-free.app/launch`
   - **Login URL**: `https://abc123.ngrok-free.app/login`
   - **JWKS URL**: `https://abc123.ngrok-free.app/.well-known/jwks.json`
   - **Client ID**: (same as in your .env)

### Step 4: Launch Test

1. In the IMS RI, create a deployment for your tool
2. Create a resource link
3. Click "Launch"

You should see a success page with user information!

## Testing with Canvas LMS

### Canvas Configuration

```env
PLATFORM_ISSUER=https://canvas.instructure.com
PLATFORM_AUTH_URL=https://canvas.instructure.com/api/lti/authorize_redirect
PLATFORM_TOKEN_URL=https://canvas.instructure.com/login/oauth2/token
PLATFORM_JWKS_URL=https://canvas.instructure.com/api/lti/security/jwks
CLIENT_ID=your-canvas-developer-key-id
```

### Canvas Developer Key Settings

1. Go to Account > Developer Keys
2. Create a new LTI Key
3. Configure:
   - **Target Link URI**: `https://your-ngrok-url.ngrok-free.app/launch`
   - **OpenID Connect Initiation URL**: `https://your-ngrok-url.ngrok-free.app/login`
   - **JWK Method**: Public JWK URL → `https://your-ngrok-url.ngrok-free.app/.well-known/jwks.json`
   - **Privacy Level**: Public

## Configuration Options

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `CLIENT_ID` | Yes | Tool's client ID registered with platform |
| `TOOL_URL` | Yes | Public URL of your tool |
| `REDIRECT_URI` | Yes | Must match `/launch` endpoint |
| `PLATFORM_ISSUER` | Yes | Platform's OIDC issuer |
| `PLATFORM_AUTH_URL` | Yes | Platform's authorization endpoint |
| `PLATFORM_TOKEN_URL` | Yes | Platform's token endpoint |
| `PLATFORM_JWKS_URL` | Yes | Platform's JWKS endpoint |
| `SESSION_SECRET` | Yes | Secret for session encryption |
| `NODE_ENV` | No | Set to `production` for secure cookies |

## Security Considerations

### Production Deployment

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure Session Secret**: Use a strong, random `SESSION_SECRET`
3. **Key Persistence**: Currently keys are generated on startup. For production:
   - Store keys in environment variables or secure storage
   - Implement key rotation strategy
4. **State Storage**: Currently uses in-memory store. For production:
   - Use Redis or database for state/nonce storage
   - Enable state cleanup to prevent memory leaks
5. **Rate Limiting**: Add rate limiting to `/token` and `/launch` endpoints
6. **CORS**: Configure strict CORS policies

### JWT Validation

The tool validates:
- ✅ Signature (using platform JWKS)
- ✅ Issuer (`iss`)
- ✅ Audience (`aud` = client_id)
- ✅ Expiration (`exp`)
- ✅ Nonce (prevents replay attacks)
- ✅ State (CSRF protection)

## Debugging

### Enable Verbose Logging

The server logs all requests and JWT payloads to console. Look for:

```
📥 LOGIN REQUEST RECEIVED
🚀 LAUNCH REQUEST RECEIVED
📋 DECODED JWT PAYLOAD
✅ LTI LAUNCH SUCCESSFUL
```

### Common Issues

**Invalid State**
- Check that cookies are enabled
- Verify session middleware is working
- Ensure `saveUninitialized: false` in session config

**JWT Verification Failed**
- Verify platform JWKS URL is accessible
- Check that `iss` and `aud` match expected values
- Ensure platform's clock is synchronized

**Nonce Mismatch**
- Nonce is stored in memory and session
- If using multiple server instances, use shared storage

**CORS Errors**
- Ensure cookies are sent with `credentials: 'include'`
- Check `sameSite` cookie settings

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   LMS Platform  │         │   LTI Tool      │
│                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ User Clicks│──┼──1─────▶│  │ /login    │  │
│  │ Tool Link │  │         │  └───────────┘  │
│  └───────────┘  │         │        │        │
│        │        │         │        ▼        │
│        │        │    2    │  ┌───────────┐  │
│        │◀───────┼─────────│  │ Redirect  │  │
│        │        │         │  │ to Auth   │  │
│  ┌───────────┐  │         │  └───────────┘  │
│  │ /authorize│  │         │                 │
│  │   (OIDC)  │  │         │  ┌───────────┐  │
│  └───────────┘  │         │  │ /launch   │  │
│        │        │    3    │  └───────────┘  │
│        ├────────┼─────────▶│        │       │
│        │ Form   │  POST   │        ▼       │
│        │ POST   │id_token │  ┌───────────┐  │
│        │        │         │  │ Verify    │  │
│        │        │         │  │ JWT       │  │
│        │        │    4    │  └───────────┘  │
│        │◀───────┼─────────│  │ Success   │  │
│        │        │  HTML   │  │ Page      │  │
│  ┌───────────┐  │         │  └───────────┘  │
│  │  Display  │  │         │                 │
│  │  Tool     │  │         │                 │
│  └───────────┘  │         │                 │
└─────────────────┘         └─────────────────┘
```

## API Reference

### GET /login

Initiates OIDC login flow.

**Query Parameters:**
- `iss` (required): Platform issuer
- `login_hint` (required): User identifier hint
- `target_link_uri` (required): Where to redirect after launch
- `lti_message_hint` (optional): LTI-specific message hint
- `lti_deployment_id` (optional): Deployment identifier

### POST /launch

Receives and validates LTI launch.

**Form Parameters:**
- `id_token` (required): JWT containing LTI claims
- `state` (required): State parameter from login

### POST /token

OAuth2 client credentials endpoint.

**Form Parameters:**
- `grant_type` (required): Must be `client_credentials`
- `client_assertion_type` (required): Must be `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`
- `client_assertion` (required): JWT signed by tool
- `scope` (optional): Requested scopes

## License

MIT
