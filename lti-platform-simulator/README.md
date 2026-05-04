# LTI 1.3 Platform Simulator

A complete fake LTI 1.3 Platform simulator for testing your LMS end-to-end without needing Canvas or Moodle.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd lti-platform-simulator
   npm install
   ```

2. **Start the fake platform:**
   ```bash
   npm start
   ```

3. **Run the automated test:**
   ```bash
   npm test
   ```

4. **Manual testing:**
   Open http://localhost:4000/simulate-launch in your browser

## 📋 Setup Your LMS

Add this fake platform to your LMS database:

```javascript
// MongoDB document for LTIPlatform collection
{
  platform_name: "Fake LTI Platform Simulator",
  issuer: "http://localhost:4000",
  client_id: "lti-tool-client-id",
  deployment_id: "test-deployment-1",
  authorization_endpoint: "http://localhost:4000/api/authorize",
  token_endpoint: "http://localhost:4000/api/token",
  jwks_url: "http://localhost:4000/api/.well-known/jwks.json",
  redirect_uri: "http://localhost:5050/api/lti/launch",
  active: true
}
```

## 🔧 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/simulate-launch` | Starts the complete LTI flow |
| GET | `/health` | Health check endpoint |
| GET | `/.well-known/jwks.json` | JWKS public keys |
| GET | `/authorize` | OAuth2 authorization endpoint |
| POST | `/token` | OAuth2 token endpoint |

## 🔄 Flow

1. **Fake Platform** → `GET /lti/login` (LMS)
2. **LMS** → Redirect to `/authorize` (Fake Platform)  
3. **Fake Platform** → Auto-POST to `/lti/launch` (LMS)
4. **LMS** → Verify JWT → Login user → Redirect to dashboard

## 🎯 JWT Claims

The simulator generates LTI 1.3 compliant JWTs with:

- Standard OpenID Connect claims (`iss`, `sub`, `aud`, `nonce`, etc.)
- LTI 1.3 specific claims:
  - `https://purl.imsglobal.org/spec/lti/claim/deployment_id`
  - `https://purl.imsglobal.org/spec/lti/claim/context`
  - `https://purl.imsglobal.org/spec/lti/claim/roles`
  - `https://purl.imsglobal.org/spec/lti/claim/resource_link`
  - And more...

## 🔐 Security

- Uses RS256 signing with generated RSA key pair
- JWKS endpoint exposes public key for verification
- Proper nonce and state handling
- JWT expiration set to 1 hour

## 🐛 Troubleshooting

**Platform not starting:**
- Check if port 4000 is available
- Run `npm install` to install dependencies

**LMS not verifying JWT:**
- Ensure platform is added to LMS database with correct URLs
- Check client_id matches between platform and LMS
- Verify JWKS endpoint is accessible

**Flow not completing:**
- Check browser console for errors
- Verify LMS is running on port 5050
- Check session handling in LMS

## 📝 Testing

The automated test script (`test-launch.js`) verifies:
- Platform health
- JWKS endpoint availability
- Complete LTI flow initiation
- LMS response verification

## 🎉 Success Indicators

When working correctly, you should see:
1. Platform starts successfully on port 4000
2. JWKS keys are generated and logged
3. LTI login flow redirects through all steps
4. User ends up logged into LMS dashboard
5. Console shows "LTI Launch Success" message
