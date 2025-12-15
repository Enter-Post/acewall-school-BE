import express from "express";
import { cleverCallback } from "../Contollers/clever.Controller.js";

const router = express.Router();

router.get("/callback", cleverCallback);

export default router;
