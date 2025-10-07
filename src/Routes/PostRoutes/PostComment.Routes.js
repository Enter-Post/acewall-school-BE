import express from "express";
import { sendPostComment } from "../../Contollers/PostControllers/postComment.controller";

const router = express.Router();

router.post("/sendComment/:id", sendPostComment);

export default router;