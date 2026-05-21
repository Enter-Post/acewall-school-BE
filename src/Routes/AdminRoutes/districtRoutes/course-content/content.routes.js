import express from "express"
import { isUser } from "../../../../middlewares/Auth.Middleware.js"
import { getContentDetail } from "../../../../Contollers/AdminControllers/district.controllers/course-content/content.controller.js"

const router = express.Router()

router.get("/:type/:contentId", isUser, getContentDetail)

export default router