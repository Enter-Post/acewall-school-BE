import express from "express";
import { askAI, getChatHistory } from "../Contollers/aiChat.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { upload } from "../lib/multer.config.js";

const router = express.Router();

router.post("/ask", upload.single("file"), isUser, askAI);
router.get("/getChatHistory", isUser, getChatHistory)

export default router;