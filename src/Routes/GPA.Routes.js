import { getGPAScale, setGPAscale } from "../Contollers/GPA.controller.js";
import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

router.post("/setGPAscale", isUser, setGPAscale);
router.get("/get", isUser, getGPAScale);


export default router;