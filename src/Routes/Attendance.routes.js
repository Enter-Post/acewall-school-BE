import express from "express";

import { isUser } from "../middlewares/Auth.Middleware.js";
import { getAttendanceByDate, getStudentAttendance, saveAttendance, updateAttendanceNote } from "../Contollers/Attendance.controller.js";

const router = express.Router();

// 🔹 Mark or Update attendance for a list of students
// Expects: { courseId, date, records: { studentId: status } }
router.post("/mark-attendance", isUser, saveAttendance);

// 🔹 Fetch existing attendance records for a specific course and date
// Example: /get-attendance/course123/2023-10 -25
router.get("/get-attendance/:courseId/:date", isUser, getAttendanceByDate);
router.get("/my-attendance", isUser, getStudentAttendance);
router.put("/update-note", isUser, updateAttendanceNote);
export default router;