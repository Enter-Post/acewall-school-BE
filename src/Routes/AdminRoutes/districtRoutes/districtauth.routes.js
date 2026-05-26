import express from "express"
import { districtSignup, getDistrictUsers, getDistrictDashboardStats } from "../../../Contollers/AdminControllers/district.controllers/districtauth.controller.js"
import { isUser } from "../../../middlewares/Auth.Middleware.js"
import { getTeacherById, getStudentById, getAdminById, updateUser } from "../../../Contollers/AdminControllers/district.controllers/users.controller.js"

const router = express.Router()

// Dashboard stats
router.get("/dashboard/stats", isUser, getDistrictDashboardStats)

//create user for a school admin/teacher/student
router.post("/:schoolId", isUser, districtSignup)
router.get("/:schoolId", isUser, getDistrictUsers)

//get users
router.get("/teacher/:id/:schoolId", isUser, getTeacherById)
router.get("/student/:id/:schoolId", isUser, getStudentById)
router.get("/admin/:id/:schoolId", isUser, getAdminById)

//update user
router.put("/updateuser/:id/:schoolId", isUser, updateUser)

export default router
