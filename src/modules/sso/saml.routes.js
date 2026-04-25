import express from 'express';
import {
  samlLogin,
  samlCallback,
  getMetadata,
  getSsoStatus,
  linkSamlAccount,
  unlinkSamlAccount,
  getSamlConfig,
  updateSamlConfig,
  samlLogout
} from './saml.controller.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// SAML SSO endpoints
router.get('/login', samlLogin);
router.post('/callback', samlCallback);
router.get('/metadata', getMetadata);
router.get('/status', isAuthenticated, getSsoStatus);
router.post('/link', isAuthenticated, linkSamlAccount);
router.post('/unlink', isAuthenticated, unlinkSamlAccount);
router.get('/config', isAuthenticated, getSamlConfig);
router.put('/config', isAuthenticated, updateSamlConfig);
router.post('/logout', isAuthenticated, samlLogout);

export default router;
