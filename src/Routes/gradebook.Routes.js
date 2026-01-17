import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";
import {
  getGradingScale,
  getStudentGradebook,
  getStudentGradeReport,
  setGradingScale,
  getGradebookForCourse,
  getTeacherStudentAnalytics
} from "../Contollers/grade.controller.js";
import { getGradebooksOfCourseFormatted, getGradebooksOfStudentCourseFormatted, getStudentGradebooksFormatted, getStudentGradebooksFormattedAnalytics } from "../Contollers/gradebookUpdated.controller.js";

const router = express.Router();

router.get("/getGradebook/:studentId/:courseId", isUser, getStudentGradebook);
router.get("/getOverallGradeReport", isUser, getStudentGradeReport);
router.post("/gradingScale", isUser, setGradingScale);
router.get("/getGradingScale", isUser, getGradingScale);
router.get("/course/:courseId", getGradebookForCourse);
router.get("/getTeacherStudentAnalytics/:courseId/:studentId", isUser, getTeacherStudentAnalytics);
// Usually in studentRoutes.js or gradebookRoutes.js
router.get("/getStudentGradebooksFormattedAnalytics", isUser, getStudentGradebooksFormattedAnalytics);
//////updated APIS
router.get("/getStudentGradebooksFormatted", isUser, getStudentGradebooksFormatted)
router.get("/getGradebooksOfCourseFormatted/:courseId", isUser, getGradebooksOfCourseFormatted)
router.get("/getGradebooksOfStudentCourseFormatted/:studentId/:courseId", isUser, getGradebooksOfStudentCourseFormatted)

export default router;
