import express from "express"
import { LTILaunch, LTIlogin } from "../Contollers/lti.controller.js"
import { isUser } from "../middlewares/Auth.Middleware.js"

const router = express.Router()

router.get("/login", isUser, LTIlogin)
router.post("/launch", isUser, LTILaunch)
export default router