import express from "express"
import { getCourseDetails, getCoursesOfteacher, getCourseHierarchy } from "../../../Contollers/AdminControllers/district.controllers/courses.controller.js"
import { isUser } from "../../../middlewares/Auth.Middleware.js"

const router = express.Router()

router.get("/teacher/:teacherId/:schoolId", isUser, getCoursesOfteacher)
router.get("/details/:courseId/:schoolId", isUser, getCourseDetails)
router.get("/hierarchy/:courseId", isUser, getCourseHierarchy)

export default router