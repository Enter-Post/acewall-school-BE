import express from "express";
import { createPost } from "../Contollers/post.controller.js";
import { upload } from "../lib/DSmulter.config.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

router.post("/", upload.array("assets"), isUser, createPost);

export default router;