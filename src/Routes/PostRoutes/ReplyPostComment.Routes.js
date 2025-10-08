import express from "express";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { sendReplyofComment } from "../../Contollers/PostControllers/replypostcontroller.js";

const router = express.Router()

router.post("reply/:commentId", isUser, sendReplyofComment)

export default router