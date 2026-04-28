import express from "express"
import { ltiLaunch, ltiLogin } from "../Contollers/lti.controller.js"
import { isUser } from "../middlewares/Auth.Middleware.js"

const router = express.Router()

router.get("/login", isUser, ltiLogin)
router.post("/launch", isUser, ltiLaunch)
export default router