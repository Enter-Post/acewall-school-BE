import express from "express";
import {
  samlInit,
  samlLogin,
  samlCallback,
  getSamlProviders,
  samlError,
  samlAuthenticateMiddleware,
} from "../Contollers/saml.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SAML SSO
 *   description: SAML 2.0 Single Sign-On authentication
 */

/**
 * @swagger
 * /api/auth/saml/providers:
 *   get:
 *     summary: Get available SAML identity providers
 *     tags: [SAML SSO]
 *     responses:
 *       200:
 *         description: List of configured SAML providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       displayName:
 *                         type: string
 */
router.get("/providers", getSamlProviders);

/**
 * @swagger
 * /api/auth/saml/init/{provider}:
 *   post:
 *     summary: Initialize SAML SSO flow
 *     tags: [SAML SSO]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [okta, azure]
 *         description: SAML identity provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [teacher, student]
 *                 description: User role (must come from frontend)
 *     responses:
 *       200:
 *         description: SSO flow initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 redirectUrl:
 *                   type: string
 *       400:
 *         description: Invalid provider or role
 */
router.post("/init/:provider", samlInit);

/**
 * @swagger
 * /api/auth/saml/login/{provider}:
 *   get:
 *     summary: Redirect to SAML Identity Provider
 *     tags: [SAML SSO]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: SAML identity provider
 *     responses:
 *       302:
 *         description: Redirect to IdP login page
 */
router.get("/login/:provider", samlLogin);

/**
 * @swagger
 * /api/auth/saml/callback:
 *   post:
 *     summary: SAML callback endpoint (IdP redirects here) - SINGLE ROUTE FOR ALL PROVIDERS
 *     tags: [SAML SSO]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               SAMLResponse:
 *                 type: string
 *                 description: Base64 encoded SAML response
 *               RelayState:
 *                 type: string
 *                 description: Optional relay state
 *     responses:
 *       302:
 *         description: Redirect to frontend dashboard or error page
 *       400:
 *         description: Invalid SAML response
 */
// SINGLE callback route - handles all providers via session tracking
// Provider is determined from req.session.samlProvider set during /saml/init
router.post("/callback", (req, res, next) => {
  // Get provider from session (set during init)
  const provider = req.session?.samlProvider || "okta";
  samlAuthenticateMiddleware(provider)(req, res, next);
}, samlCallback);

/**
 * @swagger
 * /api/auth/saml/error:
 *   get:
 *     summary: SAML error handler
 *     tags: [SAML SSO]
 *     parameters:
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code
 *     responses:
 *       302:
 *         description: Redirect to frontend login with error
 */
router.get("/error", samlError);

export default router;
