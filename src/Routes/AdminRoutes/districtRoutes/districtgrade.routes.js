import express from "express"
import { isUser } from "../../../middlewares/Auth.Middleware.js"
import { getGpa, getGradingScale, getStandardGradingScale, setGpa, setGradingScale, setStandardGradingScale } from "../../../Contollers/AdminControllers/district.controllers/districtgrade.controller.js"

const router = express.Router()

router.post("/setgradingScale", isUser, setGradingScale)
router.get("/getgradingScale", isUser, getGradingScale)

router.post("/setstandardGradingScale", isUser, setStandardGradingScale)
router.get("/getstandardGradingScale", isUser, getStandardGradingScale)

router.post("/setgpa", isUser, setGpa)
router.get("/getgpa", isUser, getGpa)

export default router