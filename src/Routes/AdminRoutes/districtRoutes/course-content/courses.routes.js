import express from "express"
import { getCourseDetails, getCourseHierarchy, getCoursesOfteacher } from "../../../../Contollers/AdminControllers/district.controllers/course-content/courses.controller.js"
import { isUser } from "../../../../middlewares/Auth.Middleware.js"

const router = express.Router()

router.get("/teacher/:teacherId/:schoolId", isUser, getCoursesOfteacher)
router.get("/details/:courseId/:schoolId", isUser, getCourseDetails)
router.get("/hierarchy/:courseId/:teacherId", isUser, getCourseHierarchy)

export default router