import express from "express";
import * as cleverController from "./clever.controller.js";

const router = express.Router();

// GET /api/auth/clever/login
router.get("/login", cleverController.login);

// GET /api/auth/clever/callback
router.get("/callback", cleverController.callback);

// GET /api/auth/clever/instant-login
router.get("/instant-login", cleverController.instantLogin);

export default router;
