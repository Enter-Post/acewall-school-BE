import express from "express";
import {
  allStudent,
  allTeacher,
  deleteUser,
  getStudentById,
  getTeacherById,
  updateParentEmail,
} from "../Contollers/auth.controller.js";
import { getStudentEnrolledCourses } from "../Contollers/enrollment.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { archivedSemester } from "../Contollers/CourseControllers/semester.controller.js";
import { archivedQuarter } from "../Contollers/CourseControllers/quarter.controller.js";
import { getCategoriesforAdmin } from "../Contollers/category.controller.js";
// import { checkRole, isAllowed } from "../Middlewares/admins.Middleware.js";
const router = express.Router();

router.get("/allTeacher", allTeacher);
router.get("/allstudent", allStudent);
router.get("/student-enrolled-courses/:id", getStudentEnrolledCourses);
router.get("/getStudentById/:id", isUser, getStudentById);
router.get("/getTeacherById/:id", isUser, getTeacherById);
router.put("/updateSemArchiveStatus/:semesterId", isUser, archivedSemester);
router.put("/updateQtrArchiveStatus/:quarterId", isUser, archivedQuarter);
router.delete("/users/:userId", isUser, deleteUser);
router.get("/getCategories", isUser, getCategoriesforAdmin)
router.put("/updateParentEmail/:id", isUser, updateParentEmail);

export default router;
