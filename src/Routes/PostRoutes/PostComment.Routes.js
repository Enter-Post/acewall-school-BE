import express from "express";
import { getPostComment, sendPostComment } from "../../Contollers/PostControllers/postComment.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";

const router = express.Router();

router.post("/sendComment/:id", isUser, sendPostComment);
router.get("/getPostComment/:id", isUser, getPostComment)

export default router;