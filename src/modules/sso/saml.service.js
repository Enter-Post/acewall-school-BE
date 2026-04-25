import passport from 'passport';
import { Strategy as SamlStrategy } from 'passport-saml';
import User from '../../Models/user.model.js';
import { generateToken } from '../../Utiles/jwtToken.js';

// SAML configuration for Azure AD / BCPS
const samlConfig = {
  entryPoint: process.env.SAML_ENTRY_POINT || 'https://login.microsoftonline.com/common/saml2',
  issuer: process.env.SAML_ISSUER || 'acewall-scholars-bcps',
  callbackUrl: process.env.SAML_CALLBACK_URL || '/api/auth/saml/callback',
  cert: process.env.SAML_CERT || '',
  privateKey: process.env.SAML_PRIVATE_KEY || '',
  decryptionPvk: process.env.SAML_DECRYPTION_KEY || '',
  identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
  acceptedClockSkewMs: 60000,
  disableRequestedAuthnContext: true,
  wantAssertionsSigned: true,
  wantAuthnResponseSigned: true,
};

export const configureSamlStrategy = () => {
  return new SamlStrategy(samlConfig, async (profile, done) => {
    try {
      // Extract user info from SAML profile
      const email = profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
      const firstName = profile.firstName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
      const lastName = profile.lastName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];
      const role = mapSamlRole(profile.role || profile['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
      const districtId = profile.districtId || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/tenantid'];
      
      // Check if user exists
      let user = await User.findOne({ email });
      
      if (!user) {
        // Create new user from SAML
        user = await User.create({
          email,
          firstName,
          lastName,
          role,
          districtId,
          authProvider: 'saml',
          isEmailVerified: true,
          samlId: profile.nameID,
        });
      } else {
        // Update existing user with SAML info
        user.samlId = profile.nameID;
        user.authProvider = 'saml';
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  });
};

// Map SAML roles to LMS roles
const mapSamlRole = (samlRole) => {
  const roleMap = {
    'student': 'student',
    'teacher': 'teacher', 
    'admin': 'admin',
    'administrator': 'admin',
    'district_admin': 'district_admin',
    'parent': 'parent',
    'staff': 'instructor'
  };
  
  return roleMap[samlRole?.toLowerCase()] || 'student';
};

// SAML Authentication middleware
export const samlAuth = passport.authenticate('saml', {
  failureRedirect: '/login?error=saml_failed',
  failureFlash: true
});

// SAML Callback handler
export const handleSamlCallback = async (req, res, next) => {
  try {
    passport.authenticate('saml', { session: false }, async (err, user, info) => {
      if (err) {
        return res.redirect('/login?error=saml_error');
      }
      
      if (!user) {
        return res.redirect('/login?error=auth_failed');
      }
      
      // Generate JWT token
      generateToken(user, user.role, req, res);
      
      // Redirect based on role
      const redirectMap = {
        'district_admin': '/district-admin',
        'admin': '/admin',
        'teacher': '/teacher',
        'student': '/student',
        'parent': '/parent'
      };
      
      res.redirect(redirectMap[user.role] || '/');
    })(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Service Provider metadata for BCPS to configure
export const getSamlMetadata = () => {
  const strategy = configureSamlStrategy();
  return strategy.generateServiceProviderMetadata(samlConfig.decryptionPvk);
};

export default {
  configureSamlStrategy,
  samlAuth,
  handleSamlCallback,
  getSamlMetadata
};
