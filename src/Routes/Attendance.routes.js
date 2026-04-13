import express from "express";

import { isUser } from "../middlewares/Auth.Middleware.js";
import { getAttendanceByDate, getStudentAttendance, saveAttendance, updateAttendanceNote } from "../Contollers/Attendance.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/attendance/mark-attendance:
 *   post:
 *     summary: Mark or update attendance for multiple students
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - date
 *               - records
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Attendance date (YYYY-MM-DD format)
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       description: Student ID
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *                       description: Attendance status
 *                     note:
 *                       type: string
 *                       description: Optional attendance note
 *                     timeIn:
 *                       type: string
 *                       format: time
 *                       description: Check-in time (HH:mm format)
 *                     timeOut:
 *                       type: string
 *                       format: time
 *                       description: Check-out time (HH:mm format)
 *                 description: Array of student attendance records
 *               markedBy:
 *                 type: string
 *                 description: ID of user marking attendance
 *               sessionType:
 *                 type: string
 *                 enum: [regular, makeup, extra]
 *                 default: regular
 *                 description: Type of attendance session
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     courseId:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *                     totalStudents:
 *                       type: integer
 *                     markedCount:
 *                       type: integer
 *                     attendanceRecords:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           studentId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           note:
 *                             type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/mark-attendance", isUser, saveAttendance);

/**
 * @swagger
 * /api/attendance/get-attendance/{courseId}/{date}:
 *   get:
 *     summary: Get attendance records for a specific course and date
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^\d{4}-\d{2}-\d{2}$
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, present, absent, late, excused]
 *           default: all
 *         description: Filter by attendance status
 *     responses:
 *       200:
 *         description: Attendance records retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     date:
 *                       type: string
 *                       format: date
 *                     attendanceRecords:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           status:
 *                             type: string
 *                             enum: [present, absent, late, excused]
 *                           timeIn:
 *                             type: string
 *                             format: time
 *                           timeOut:
 *                             type: string
 *                             format: time
 *                           note:
 *                             type: string
 *                           markedBy:
 *                             $ref: '#/components/schemas/User'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalStudents:
 *                           type: integer
 *                         presentCount:
 *                           type: integer
 *                         absentCount:
 *                           type: integer
 *                         lateCount:
 *                           type: integer
 *                         excusedCount:
 *                           type: integer
 *                         attendanceRate:
 *                           type: number
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get-attendance/:courseId/:date", isUser, getAttendanceByDate);

/**
 * @swagger
 * /api/attendance/my-attendance:
 *   get:
 *     summary: Get attendance records for current student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for attendance range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for attendance range (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, present, absent, late, excused]
 *           default: all
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Student attendance records retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       $ref: '#/components/schemas/User'
 *                     attendanceRecords:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           date:
 *                             type: string
 *                             format: date
 *                           status:
 *                             type: string
 *                             enum: [present, absent, late, excused]
 *                           timeIn:
 *                             type: string
 *                             format: time
 *                           timeOut:
 *                             type: string
 *                             format: time
 *                           note:
 *                             type: string
 *                           markedBy:
 *                             $ref: '#/components/schemas/User'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalClasses:
 *                           type: integer
 *                         presentCount:
 *                           type: integer
 *                         absentCount:
 *                           type: integer
 *                         lateCount:
 *                           type: integer
 *                         excusedCount:
 *                           type: integer
 *                         attendanceRate:
 *                           type: number
 *                         attendancePercentage:
 *                           type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalRecords:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/my-attendance", isUser, getStudentAttendance);

/**
 * @swagger
 * /api/attendance/update-note:
 *   put:
 *     summary: Update attendance note for a student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendanceId
 *               - note
 *             properties:
 *               attendanceId:
 *                 type: string
 *                 description: Attendance record ID
 *               note:
 *                 type: string
 *                 description: Updated attendance note
 *               reason:
 *                 type: string
 *                 description: Reason for note update (optional)
 *               updatedBy:
 *                 type: string
 *                 description: ID of user updating the note
 *     responses:
 *       200:
 *         description: Attendance note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendanceId:
 *                       type: string
 *                     oldNote:
 *                       type: string
 *                     newNote:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     updatedBy:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: Attendance record not found
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.put("/update-note", isUser, updateAttendanceNote);

export default router;