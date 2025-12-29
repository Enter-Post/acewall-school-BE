import express from "express";
import { getChildrenData } from "../Contollers/auth.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";


const router = express.Router();

// GET /api/parent/my-children
router.get("/my-children", isUser, getChildrenData);

export default router;