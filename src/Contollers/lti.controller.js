import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import LTITool from "../Models/LTITools.model.js";

export const LTIlogin = async (req, res) => {
  try {
    const { tool_id, redirect_uri } = req.query;
    
    if (!tool_id) {
      return res.status(400).json({ error: 'Missing tool_id parameter' });
    }

    // Find tool configuration
    const tool = await LTITool.findById(tool_id);
    if (!tool) {
      return res.status(404).json({ error: 'Tool configuration not found' });
    }

    // Validate redirect URI if provided
    if (redirect_uri && !tool.redirect_uris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }

    // Generate OIDC authentication request parameters
    const params = new URLSearchParams({
      response_type: 'id_token',
      scope: 'openid profile email',
      client_id: tool.client_id,
      redirect_uri: redirect_uri || tool.redirect_uris[0],
      state: Math.random().toString(36).substring(2, 15), // Generate random state
      nonce: Math.random().toString(36).substring(2, 15),  // Generate random nonce
      login_hint: req.query.login_hint || '',
      lti_message_hint: req.query.lti_message_hint || '',
      prompt: 'none'
    });

    // Build the complete authentication URL
    const authUrl = `${tool.auth_login_url}?${params.toString()}`;

    // Redirect user to LMS authentication
    res.redirect(302, authUrl);

  } catch (error) {
    console.error('LTI Login Error:', error);
    res.status(500).json({ error: 'Internal server error during LTI login initiation' });
  }
};

const client = jwksClient({
  jwksUri: process.env.JWKS_URI || 'https://canvas.instructure.com/api/lti/security/jwks'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export const LTILaunch = async (req, res) => {
  try {
    const { id_token } = req.body;
    
    if (!id_token) {
      return res.status(400).json({ error: 'Missing id_token in request body' });
    }

    // Verify JWT signature using JWKS
    const decodedToken = await new Promise((resolve, reject) => {
      jwt.verify(id_token, getKey, {
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });

    // Validate claims
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Validate expiration time
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    // Validate issued at time (should not be too far in the past)
    if (decodedToken.iat && decodedToken.iat > currentTime + 300) { // 5 minute tolerance
      return res.status(401).json({ error: 'Token issued in the future' });
    }

    // Validate issuer (should match your LMS issuer)
    const expectedIssuer = process.env.LTI_ISSUER;
    if (expectedIssuer && decodedToken.iss !== expectedIssuer) {
      return res.status(401).json({ error: 'Invalid issuer' });
    }

    // Validate audience (should match your client ID)
    const expectedAudience = process.env.LTI_CLIENT_ID;
    if (expectedAudience) {
      const aud = Array.isArray(decodedToken.aud) ? decodedToken.aud : [decodedToken.aud];
      if (!aud.includes(expectedAudience)) {
        return res.status(401).json({ error: 'Invalid audience' });
      }
    }

    // Validate nonce (should be unique and not replayed)
    if (!decodedToken.nonce) {
      return res.status(401).json({ error: 'Missing nonce' });
    }

    // Here you would typically check if the nonce has been used before
    // For now, we'll just validate it exists

    // LTI 1.3 specific validation
    if (decodedToken['https://purl.imsglobal.org/spec/lti/claim/message_type'] !== 'LtiResourceLinkRequest') {
      return res.status(401).json({ error: 'Invalid LTI message type' });
    }

    if (decodedToken['https://purl.imsglobal.org/spec/lti/claim/version'] !== '1.3.0') {
      return res.status(401).json({ error: 'Invalid LTI version' });
    }

    // If all validations pass, return success with relevant data
    const launchData = {
      userId: decodedToken.sub,
      contextId: decodedToken['https://purl.imsglobal.org/spec/lti/claim/context']?.id,
      resourceId: decodedToken['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.id,
      roles: decodedToken['https://purl.imsglobal.org/spec/lti/claim/roles'],
      deploymentId: decodedToken['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
      platform: decodedToken.iss,
      nonce: decodedToken.nonce
    };

    res.status(200).json({
      success: true,
      message: 'LTI launch successful',
      data: launchData
    });

  } catch (error) {
    console.error('LTI Launch Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid JWT signature' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token not active' });
    }
    
    res.status(500).json({ error: 'Internal server error during LTI launch' });
  }
};