import express from "express";
import {
  createConversation,
  //   getConversationbyId,
  getMyConversations,
  getStudentsByOfTeacher,
  getTeacherCourses,
  getTeacherforStudent,
} from "../Contollers/conversation.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getMyConversations_updated, updateLastSeen } from "../Contollers/UPDATED_API_CONTROLLER/conversation-controller.web.js";

const router = express.Router();

router.post("/create", isUser, createConversation);
router.get("/get", isUser, getMyConversations);
// router.get("/get/:id", isUser, getConversationbyId);
router.get("/getTeacherforStudent", isUser, getTeacherforStudent)

//////// updated-apis
router.get("/get-updated", isUser, getMyConversations_updated);
router.patch("/lastSeen/:conversationId", isUser, updateLastSeen)

router.get("/getStudentsByOfTeacher/:courseId", isUser, getStudentsByOfTeacher)
router.get("/getTeacherCourses", isUser, getTeacherCourses)

export default router;
