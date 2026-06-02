import express from "express"
import { districtSignup, getDistrictUsers, getDistrictDashboardStats, createDistrictAdmin } from "../../../Contollers/AdminControllers/district.controllers/districtauth.controller.js"
import { isUser } from "../../../middlewares/Auth.Middleware.js"
import { getTeacherById, getStudentById, getAdminById, updateUser, getDistrictAdmins } from "../../../Contollers/AdminControllers/district.controllers/users.controller.js"

const router = express.Router()

// Dashboard stats
router.get("/dashboard/stats", isUser, getDistrictDashboardStats)

// create user for a school admin/teacher/student
router.post("/:schoolId", isUser, districtSignup)
router.get("/:schoolId", isUser, getDistrictUsers)

// create and get district admin
router.post("/create-district-admin/:districtId", isUser, createDistrictAdmin)
router.get("/get-district-admins/:districtId", isUser, getDistrictAdmins)

// get users
router.get("/teacher/:id", isUser, getTeacherById)
router.get("/student/:id", isUser, getStudentById)
router.get("/admin/:id", isUser, getAdminById)

//update user
router.put("/updateuser/:id", isUser, updateUser)

export default router
