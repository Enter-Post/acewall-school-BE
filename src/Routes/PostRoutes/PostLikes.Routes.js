import express from "express";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { likePost } from "../../Contollers/PostControllers/postLikes.controller.js";

const router = express.Router();

router.post("/like/:id", isUser, likePost);

export default router;