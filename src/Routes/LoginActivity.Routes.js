import express from "express"
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getLoginActivityofStudent } from "../Contollers/loginActivity.controller.js";

const router = express.Router();

router.get("/getLoginActivityofStudent/:userId", isUser, getLoginActivityofStudent)

export default router;