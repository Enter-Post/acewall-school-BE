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
import {
  getAllCoursesForAdmin,
  toggleAllCoursesComments,
  toggleCourseComments,
} from "../Contollers/CourseControllers/courses.controller.sch.js";
import { getAssessmentsByCourseForAdmin } from "../Contollers/Assessment.controller.js";
import { getAdminMonthlyAttendance } from "../Contollers/Attendance.controller.js";
import {
  createPacingChart,
  deletePacingChart,
  getPacingChartByCourse,
  updatePacingChart,
} from "../Contollers/PacingChart.controller.js";
// import { checkRole, isAllowed } from "../Middlewares/admins.Middleware.js";
const router = express.Router();

router.get("/allTeacher", allTeacher);
router.get("/allstudent", allStudent);
router.get("/courses", isUser, getAllCoursesForAdmin);
router.get(
  "/courses/:courseId/assessments",
  isUser,
  getAssessmentsByCourseForAdmin,
);

router.get("/student-enrolled-courses/:id", getStudentEnrolledCourses);
router.get("/getStudentById/:id", isUser, getStudentById);
router.get("/getTeacherById/:id", isUser, getTeacherById);
router.put("/updateSemArchiveStatus/:semesterId", isUser, archivedSemester);
router.put("/updateQtrArchiveStatus/:quarterId", isUser, archivedQuarter);
router.delete("/users/:userId", isUser, deleteUser);
router.get("/getCategories", isUser, getCategoriesforAdmin);
router.put("/updateParentEmail/:id", isUser, updateParentEmail);
router.patch("/:courseId/toggle-comments", toggleCourseComments);
router.patch("/toggle-all-comments", isUser, toggleAllCoursesComments);
router.get("/monthly/:courseId", isUser, getAdminMonthlyAttendance);

// Pacing Chart Routes
router.post("/courses/pacing-chart", isUser, createPacingChart);
router.get("/courses/:courseId/pacing-chart", isUser, getPacingChartByCourse);
router.put("/courses/:courseId/pacing-chart", isUser, updatePacingChart);
router.delete("/courses/:courseId/pacing-chart", isUser, deletePacingChart);

export default router;
