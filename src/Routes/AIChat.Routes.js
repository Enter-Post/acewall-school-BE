import express from "express";
import { askAI, getChatHistory } from "../Contollers/aiChat.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

    router.post("/ask", isUser, askAI);
router.get("/getChatHistory", isUser, getChatHistory)

export default router;