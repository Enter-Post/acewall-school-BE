import express from "express";
import { sendPostComment } from "../../Contollers/PostControllers/postComment.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";

const router = express.Router();

router.post("/sendComment/:id", isUser, sendPostComment);

export default router;