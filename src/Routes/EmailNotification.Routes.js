import { getGuardianEmailPreferences, updateGuardianEmailPreferences } from "../Contollers/emailNotification.controller.js"
import express from "express"
import { isUser } from "../middlewares/Auth.Middleware.js"

const router = express.Router()

router.get("/get/:studentId", isUser,getGuardianEmailPreferences)
router.put("/update/:studentId", isUser,updateGuardianEmailPreferences)

export default router