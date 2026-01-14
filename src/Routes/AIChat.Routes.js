import express from "express";
import { askAIupdated, generateContentForTeacher, generateImage, getAllBooks, getChatHistory, uploadBook } from "../Contollers/aiChat.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { upload } from "../lib/DSmulter.config.js";

const router = express.Router();

// router.post("/ask", upload.single("file"), isUser, askAI);
router.get("/getChatHistory", isUser, getChatHistory)
router.post("/askupdated", upload.single("file"), isUser, askAIupdated);
router.post("/generateContentForTeacher", isUser, generateContentForTeacher);
router.post("/generateImage", isUser, generateImage);
router.post("/uploadBook", upload.single("bookFile"), isUser, uploadBook);
router.get("/getAllBooks", isUser, getAllBooks)
export default router;