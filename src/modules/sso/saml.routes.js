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
import { isUser } from '../../middlewares/Auth.Middleware.js';

const router = express.Router();

// SAML SSO endpoints
router.get('/login', samlLogin);
router.post('/callback', samlCallback);
router.get('/metadata', getMetadata);
router.get('/status', isUser, getSsoStatus);
router.post('/link', isUser, linkSamlAccount);
router.post('/unlink', isUser, unlinkSamlAccount);
router.get('/config', isUser, getSamlConfig);
router.put('/config', isUser, updateSamlConfig);
router.post('/logout', isUser, samlLogout);

export default router;
