import express from "express";
import {
  createMessage,
  getConversationMessages,
} from "../Contollers/message.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { createMessage_updated, getAllUnreadCounts, getConversationMessages_updated, markMessagesAsRead_updated } from "../Contollers/UPDATED_API_CONTROLLER/message.controller.web.js";

const router = express.Router();

router.post("/create/:conversationId", isUser, createMessage);
router.get("/get/:conversationId", isUser, getConversationMessages);

//// updated-apis

router.post("/create_updated/:conversationId", isUser, createMessage_updated);
router.get("/get_updated/:conversationId", isUser, getConversationMessages_updated);
router.post("/markAsRead_updated/:conversationId", isUser, markMessagesAsRead_updated);
router.get("/getUnreadCount", isUser, getAllUnreadCounts);

export default router;
