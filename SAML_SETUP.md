# SAML 2.0 SSO Implementation Guide

This document provides complete setup instructions for integrating SAML 2.0 Single Sign-On with Okta (and extensible to Azure AD) for the AceWall Scholars LMS.

## Overview

The SAML implementation supports:
- **Role-based access**: User selects role (teacher/student) on frontend
- **Multi-provider**: Extensible architecture for Okta, Azure AD, etc.
- **Auto-provisioning**: New users created automatically with selected role
- **Existing user login**: Role is NEVER overwritten for existing users
- **Security**: Session-based role validation, signed SAML responses

---

## Architecture Flow

```
┌─────────────┐     1. Select Role      ┌─────────────┐
│   Frontend  │ ───────────────────────> │   Backend   │
│  (React)    │    POST /saml/init/:id │  (Express)  │
└─────────────┘                        └─────────────┘
                                              │
                                              │ 2. Store role in session
                                              ▼
                                       ┌─────────────┐
                                       │   Session   │
                                       │  (10 min)   │
                                       └─────────────┘
                                              │
                                              │ 3. Redirect to IdP
                                              ▼
                                       ┌─────────────┐
                                       │     IdP     │
                                       │  (Okta/AD)  │
                                       └─────────────┘
                                              │
                                              │ 4. User authenticates
                                              ▼
                                       ┌─────────────┐
                                       │  SAML POST  │
                                       │   Callback  │
                                       └─────────────┘
                                              │
                                              │ 5. Verify SAML
                                              │ 6. Find/Create user
                                              │ 7. Generate JWT
                                              ▼
                                       ┌─────────────┐
                                       │   Redirect  │
                                       │  to Frontend│
                                       │  Dashboard  │
                                       └─────────────┘
```

---

## Backend Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Session (Required for SAML)
SESSION_SECRET=your_strong_random_session_secret

# SAML - Okta Configuration
SAML_OKTA_ENTRY_POINT=https://your-domain.okta.com/app/okta_yourapp/exk123456/sso/saml
SAML_OKTA_ISSUER=https://your-ngrok-or-production-url.com
SAML_OKTA_CERT=-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1HiJbg6vTMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAk1ZMRkwFwYDVQQKExBNZXhpY28gU2FNTCBJZFAxFzAVBgNVBAMTDnNhbWwu
bWV4aWNvLmlvMB4XDTE0MDYwNDA5NDY0NVoXDTI0MDYwMTA5NDY0NVowRTELMAkG
A1UEBhMCTVkxGTAXBgNVBAoTEE1leGljbyBTQU1MIElkUDEXMBUGA1UEAxMOc2Ft
bC5tZXhpY28uaW8wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC0P8wP
-----END CERTIFICATE-----

# Base URLs
BACKEND_BASE_URL=https://your-ngrok-or-production-url.com
FRONTEND_URL=https://your-frontend-url.com
```

### 2. Install Dependencies

```bash
npm install passport passport-saml express-session jsonwebtoken
```

### 3. Files Created/Modified

| File | Purpose |
|------|---------|
| `src/config/saml.config.js` | SAML strategy configuration |
| `src/Controllers/saml.controller.js` | SAML login/callback handlers |
| `src/Routes/Saml.Routes.js` | SAML routes definition |
| `src/Models/user.model.js` | Added samlId, samlProvider fields |
| `src/index.js` | Added session, passport, SAML routes |

---

## Okta Configuration

### Step 1: Create SAML Application in Okta

1. Go to **Okta Admin Console** → **Applications** → **Create App Integration**
2. Select **SAML 2.0** → **Next**
3. Configure SAML:

**General Settings:**
- App name: "AceWall Scholars LMS"
- Logo: (Upload your logo)

**SAML Settings:**
- **Single Sign-On URL**: `https://your-backend.com/api/auth/saml/callback/okta`
- **Recipient URL**: `https://your-backend.com/api/auth/saml/callback/okta`
- **Destination URL**: `https://your-backend.com/api/auth/saml/callback/okta`
- **Audience URI (SP Entity ID)**: `https://your-backend.com` (match SAML_OKTA_ISSUER)
- **Name ID Format**: EmailAddress
- **Application username**: Email
- **Update application username on**: Create and update

**Attribute Statements:**
| Name | Format | Value |
|------|--------|-------|
| email | Basic | user.email |
| firstName | Basic | user.firstName |
| lastName | Basic | user.lastName |

4. **Feedback** → "I'm a software vendor"
5. **Finish**

### Step 2: Get SAML Configuration

1. Go to **Sign On** tab → **View SAML setup instructions**
2. Copy:
   - **Identity Provider Single Sign-On URL** → `SAML_OKTA_ENTRY_POINT`
   - **X.509 Certificate** → `SAML_OKTA_CERT`

### Step 3: Assign Users

1. Go to **Assignments** tab
2. Assign people/groups who can access the LMS

---

## Frontend Integration

### Route Setup

Add route in your React Router:

```jsx
import SamlLogin from "./Page/Login/SamlLogin";

// In your router configuration
<Route path="/login/sso" element={<SamlLogin />} />
```

### Add SSO Button to Login Page

```jsx
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

// In your Login component
const navigate = useNavigate();

<Button 
  variant="outline" 
  onClick={() => navigate("/login/sso")}
  className="w-full"
>
  <Shield className="mr-2 h-4 w-4" />
  Continue with SSO
</Button>
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/saml/providers` | Get available SAML providers |
| POST | `/api/auth/saml/init/:provider` | Initialize SSO with role |
| GET | `/api/auth/saml/login/:provider` | Redirect to IdP login |
| POST | `/api/auth/saml/callback/:provider` | SAML callback (IdP → Backend) |
| GET | `/api/auth/saml/error` | Error handler |

---

## Testing with ngrok (Local Development)

Since SAML requires HTTPS URLs, use ngrok for local testing:

### 1. Install ngrok

```bash
npm install -g ngrok
```

### 2. Start ngrok

```bash
ngrok http 5050
```

### 3. Update Environment

```env
BACKEND_BASE_URL=https://abc123.ngrok.io
FRONTEND_URL=http://localhost:5173
SAML_OKTA_ISSUER=https://abc123.ngrok.io
```

### 4. Update Okta

Update Okta SAML settings with ngrok URL:
- Single Sign-On URL: `https://abc123.ngrok.io/api/auth/saml/callback/okta`
- Audience URI: `https://abc123.ngrok.io`

---

## Security Considerations

1. **Role comes ONLY from frontend**: SAML response does not contain role
2. **Session validation**: Role must exist in session during callback
3. **No role override**: Existing users keep their original role
4. **Signed responses**: SAML responses are cryptographically verified
5. **HTTP-only cookies**: JWT stored in httpOnly, secure cookie
6. **Session expiration**: 10-minute timeout for SSO flow

---

## Troubleshooting

### "Session expired" error
- Session timeout is 10 minutes
- User took too long at IdP login
- Solution: Restart SSO flow

### "Invalid SAML response" error
- Check certificate format (must include BEGIN/END markers)
- Verify certificate hasn't expired
- Check SAML_OKTA_ISSUER matches Okta Audience URI

### User not redirected back to frontend
- Check FRONTEND_URL in .env
- Verify callback route is accessible

### Role not assigned correctly
- Ensure role is sent in POST /saml/init/:provider
- Check session middleware is working
- Verify req.session.selectedRole exists

---

## Extending to Azure AD

To add Azure AD support:

### 1. Add Azure config to .env:
```env
SAML_AZURE_ENTRY_POINT=https://login.microsoftonline.com/{tenant-id}/saml2
SAML_AZURE_ISSUER=your-app-id-uri
SAML_AZURE_CERT=-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
```

### 2. The system automatically detects and registers Azure strategy

### 3. Frontend will show Azure as an option in the provider dropdown

---

## Production Checklist

- [ ] Use HTTPS for all URLs
- [ ] Set strong SESSION_SECRET
- [ ] Update JWT_SECRET
- [ ] Configure production Okta app
- [ ] Set secure cookie settings
- [ ] Test with multiple users
- [ ] Verify role assignment works
- [ ] Test existing user login (role should not change)
- [ ] Monitor logs for errors

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs
3. Verify SAML configuration in Okta
4. Test with ngrok for local debugging

---

**Last Updated**: 2024
**Version**: 1.0.0
