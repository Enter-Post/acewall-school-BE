import express from "express"
import { districtSignup, getDistrictUsers } from "../../../Contollers/AdminControllers/district.controllers/districtauth.controller.js"
import { isUser } from "../../../middlewares/Auth.Middleware.js"
import { getTeacherById } from "../../../Contollers/AdminControllers/district.controllers/users.controller.js"

const router = express.Router()

//create user for a school admin/teacher/student
router.post("/:schoolId", isUser, districtSignup)
router.get("/:schoolId", isUser, getDistrictUsers)

//get users
router.get("/teacher/:id/:schoolId", isUser, getTeacherById)

export default router
