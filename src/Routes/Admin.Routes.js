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

/**
 * @swagger
 * /api/admin/allTeacher:
 *   get:
 *     summary: Get all teachers in the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all teachers retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/allTeacher", allTeacher);

/**
 * @swagger
 * /api/admin/allstudent:
 *   get:
 *     summary: Get all students in the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/allstudent", allStudent);

/**
 * @swagger
 * /api/admin/courses:
 *   get:
 *     summary: Get all courses for admin view
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of courses per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, all]
 *         description: Filter by course status
 *     responses:
 *       200:
 *         description: Admin courses list retrieved
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalCourses:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/courses", isUser, getAllCoursesForAdmin);

/**
 * @swagger
 * /api/admin/courses/{courseId}/assessments:
 *   get:
 *     summary: Get assessments for a specific course (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course assessments retrieved for admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/courses/:courseId/assessments",
  isUser,
  getAssessmentsByCourseForAdmin,
);

/**
 * @swagger
 * /api/admin/student-enrolled-courses/{id}:
 *   get:
 *     summary: Get courses enrolled by a student
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student enrolled courses retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       course:
 *                         $ref: '#/components/schemas/Course'
 *                       enrollment:
 *                         $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Student not found
 */
router.get("/student-enrolled-courses/:id", getStudentEnrolledCourses);

/**
 * @swagger
 * /api/admin/getStudentById/{id}:
 *   get:
 *     summary: Get student details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getStudentById/:id", isUser, getStudentById);

/**
 * @swagger
 * /api/admin/getTeacherById/{id}:
 *   get:
 *     summary: Get teacher details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getTeacherById/:id", isUser, getTeacherById);

/**
 * @swagger
 * /api/admin/updateSemArchiveStatus/{semesterId}:
 *   put:
 *     summary: Update semester archive status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isArchived:
 *                 type: boolean
 *                 description: Archive status to set
 *     responses:
 *       200:
 *         description: Semester archive status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 */
router.put("/updateSemArchiveStatus/:semesterId", isUser, archivedSemester);

/**
 * @swagger
 * /api/admin/updateQtrArchiveStatus/{quarterId}:
 *   put:
 *     summary: Update quarter archive status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quarterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quarter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isArchived:
 *                 type: boolean
 *                 description: Archive status to set
 *     responses:
 *       200:
 *         description: Quarter archive status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Quarter not found
 *       401:
 *         description: Unauthorized
 */
router.put("/updateQtrArchiveStatus/:quarterId", isUser, archivedQuarter);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/users/:userId", isUser, deleteUser);

/**
 * @swagger
 * /api/admin/getCategories:
 *   get:
 *     summary: Get all categories for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved for admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 */
router.get("/getCategories", isUser, getCategoriesforAdmin);

/**
 * @swagger
 * /api/admin/updateParentEmail/{id}:
 *   put:
 *     summary: Update parent email for student
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentEmail
 *             properties:
 *               parentEmail:
 *                 type: string
 *                 format: email
 *                 description: Parent email to update
 *     responses:
 *       200:
 *         description: Parent email updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Student not found
 *       400:
 *         description: Invalid email format
 *       401:
 *         description: Unauthorized
 */
router.put("/updateParentEmail/:id", isUser, updateParentEmail);

/**
 * @swagger
 * /api/admin/{courseId}/toggle-comments:
 *   patch:
 *     summary: Toggle comments for a specific course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course comments toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:courseId/toggle-comments", toggleCourseComments);

/**
 * @swagger
 * /api/admin/toggle-all-comments:
 *   patch:
 *     summary: Toggle comments for all courses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enableComments
 *             properties:
 *               enableComments:
 *                 type: boolean
 *                 description: Enable or disable comments for all courses
 *     responses:
 *       200:
 *         description: All course comments toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.patch("/toggle-all-comments", isUser, toggleAllCoursesComments);

/**
 * @swagger
 * /api/admin/monthly/{courseId}:
 *   get:
 *     summary: Get monthly attendance report for course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: Monthly attendance report retrieved
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
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     attendance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           attendanceRate:
 *                             type: number
 *                           totalClasses:
 *                             type: integer
 *                           attendedClasses:
 *                             type: integer
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/monthly/:courseId", isUser, getAdminMonthlyAttendance);

// Pacing Chart Routes

/**
 * @swagger
 * /api/admin/courses/pacing-chart:
 *   post:
 *     summary: Create pacing chart for course
 *     tags: [Admin]
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
 *               - title
 *               - description
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               title:
 *                 type: string
 *                 description: Pacing chart title
 *               description:
 *                 type: string
 *                 description: Pacing chart description
 *               weeks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     weekNumber:
 *                       type: integer
 *                     topics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Pacing chart created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/courses/pacing-chart", isUser, createPacingChart);

/**
 * @swagger
 * /api/admin/courses/{courseId}/pacing-chart:
 *   get:
 *     summary: Get pacing chart for course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Pacing chart retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PacingChart'
 *       404:
 *         description: Pacing chart not found
 *       401:
 *         description: Unauthorized
 */
router.get("/courses/:courseId/pacing-chart", isUser, getPacingChartByCourse);

/**
 * @swagger
 * /api/admin/courses/{courseId}/pacing-chart:
 *   put:
 *     summary: Update pacing chart for course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated pacing chart title
 *               description:
 *                 type: string
 *                 description: Updated pacing chart description
 *               weeks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     weekNumber:
 *                       type: integer
 *                     topics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Pacing chart updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Pacing chart not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put("/courses/:courseId/pacing-chart", isUser, updatePacingChart);

/**
 * @swagger
 * /api/admin/courses/{courseId}/pacing-chart:
 *   delete:
 *     summary: Delete pacing chart for course
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Pacing chart deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Pacing chart not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/courses/:courseId/pacing-chart", isUser, deletePacingChart);

export default router;
