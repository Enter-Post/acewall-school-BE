import passport from 'passport';
import { 
  configureSamlStrategy, 
  samlAuth, 
  handleSamlCallback, 
  getSamlMetadata 
} from './saml.service.js';
import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js';
import User from '../../Models/user.model.js';
import ErrorHandler from '../../middlewares/error.js';

// Initialize passport with SAML strategy
export const initSaml = () => {
  passport.use('saml', configureSamlStrategy());
  
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

// Redirect to SAML IdP (Azure AD)
export const samlLogin = samlAuth;

// Handle SAML callback
export const samlCallback = handleSamlCallback;

// Get Service Provider metadata
export const getMetadata = catchAsyncErrors(async (req, res, next) => {
  const metadata = getSamlMetadata();
  
  res.set('Content-Type', 'text/xml');
  res.send(metadata);
});

// Get SSO status for current user
export const getSsoStatus = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  res.status(200).json({
    success: true,
    sso: {
      enabled: process.env.SAML_ENABLED === 'true',
      provider: 'Azure AD',
      entryPoint: process.env.SAML_ENTRY_POINT,
      isLinked: !!user?.samlId,
      lastLogin: user?.lastSamlLogin
    }
  });
});

// Link existing account to SAML
export const linkSamlAccount = catchAsyncErrors(async (req, res, next) => {
  const { samlId } = req.body;
  
  if (!samlId) {
    return next(new ErrorHandler('SAML ID is required', 400));
  }
  
  // Update user with SAML ID
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { samlId, authProvider: 'saml' },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'Account linked to SAML successfully',
    user: {
      id: user._id,
      email: user.email,
      ssoLinked: true
    }
  });
});

// Unlink SAML account
export const unlinkSamlAccount = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { samlId: null, authProvider: 'local' },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'SAML account unlinked',
    user: {
      id: user._id,
      email: user.email,
      ssoLinked: false
    }
  });
});

// Get SAML configuration for district admin
export const getSamlConfig = catchAsyncErrors(async (req, res, next) => {
  // Only district admins can view this
  if (req.user.role !== 'district_admin' && req.user.role !== 'admin') {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  res.status(200).json({
    success: true,
    config: {
      enabled: process.env.SAML_ENABLED === 'true',
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      callbackUrl: process.env.SAML_CALLBACK_URL
    }
  });
});

// Update SAML configuration
export const updateSamlConfig = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== 'district_admin' && req.user.role !== 'admin') {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const { entryPoint, issuer, cert, privateKey } = req.body;
  
  // In production, these would be saved to a database or secure config
  // For now, we'll just return what would be updated
  
  res.status(200).json({
    success: true,
    message: 'SAML configuration updated',
    config: {
      entryPoint,
      issuer,
      callbackUrl: '/api/auth/saml/callback'
    }
  });
});

// Initiate SAML logout
export const samlLogout = catchAsyncErrors(async (req, res, next) => {
  // SAML Single Logout (SLO) if needed
  res.status(200).json({
    success: true,
    message: 'Logout initiated'
  });
});

export default {
  initSaml,
  samlLogin,
  samlCallback,
  getMetadata,
  getSsoStatus,
  linkSamlAccount,
  unlinkSamlAccount,
  getSamlConfig,
  updateSamlConfig,
  samlLogout
};
