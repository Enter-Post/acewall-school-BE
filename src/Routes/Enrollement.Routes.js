import express from "express";
import {
  chapterDetails,
  chapterDetailsStdPre,
  enrollment,
  enrollmentforTeacher,
  getMyEnrolledCourses,
  isEnrolled,
  studenCourses,
  studentCourseDetails,
  studentsEnrolledinCourse,
  unEnrollment,
} from "../Contollers/enrollment.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { isEnrolledMiddleware } from "../middlewares/isEnrolled.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/enrollment/my-courses:
 *   get:
 *     summary: Get current user's enrolled courses
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's enrolled courses retrieved
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
 *                       enrollment:
 *                         $ref: '#/components/schemas/Enrollment'
 *                       course:
 *                         $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 */
router.get("/my-courses", isUser, getMyEnrolledCourses);

/**
 * @swagger
 * /api/enrollment/create/{courseId}:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to enroll in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollmentType:
 *                 type: string
 *                 enum: [free, paid]
 *                 description: Type of enrollment
 *               paymentMethod:
 *                 type: string
 *                 enum: [stripe, paypal, bank_transfer]
 *                 description: Payment method (for paid enrollments)
 *               promoCode:
 *                 type: string
 *                 description: Promotional code (optional)
 *     responses:
 *       201:
 *         description: Enrollment created successfully
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
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.post("/create/:courseId", isUser, enrollment);

/**
 * @swagger
 * /api/enrollment/isEnrolled/{courseId}:
 *   get:
 *     summary: Check if user is enrolled in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to check enrollment for
 *     responses:
 *       200:
 *         description: Enrollment status retrieved
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
 *                     isEnrolled:
 *                       type: boolean
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/isEnrolled/:courseId", isUser, isEnrolled);

/**
 * @swagger
 * /api/enrollment/studentCourses:
 *   get:
 *     summary: Get all courses available for student enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available courses for enrollment retrieved
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
 *                     $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 */
router.get("/studentCourses", isUser, studenCourses);

/**
 * @swagger
 * /api/enrollment/studentCourseDetails/{enrollmentId}/{courseId}:
 *   get:
 *     summary: Get student course details with enrollment verification
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Student course details retrieved
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
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     progress:
 *                       type: number
 *                     chapters:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Enrollment or course not found
 *       401:
 *         description: Unauthorized or not enrolled
 */
router.get("/studentCourseDetails/:enrollmentId/:courseId", isUser, isEnrolledMiddleware, studentCourseDetails);

/**
 * @swagger
 * /api/enrollment/studentEnrolledinCourse/{courseId}:
 *   get:
 *     summary: Get all students enrolled in a course
 *     tags: [Enrollments]
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
 *         description: List of enrolled students retrieved
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
 *                       student:
 *                         $ref: '#/components/schemas/User'
 *                       enrollment:
 *                         $ref: '#/components/schemas/Enrollment'
 *                       enrolledAt:
 *                         type: string
 *                         format: date-time
 *                       progress:
 *                         type: number
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/studentEnrolledinCourse/:courseId",
  isUser,
  studentsEnrolledinCourse
);

/**
 * @swagger
 * /api/enrollment/enrollmentforTeacher:
 *   post:
 *     summary: Create enrollment for teacher (admin function)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - courseId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: Student ID to enroll
 *               courseId:
 *                 type: string
 *                 description: Course ID to enroll student in
 *               enrollmentType:
 *                 type: string
 *                 enum: [free, paid, scholarship]
 *                 description: Type of enrollment
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Enrollment start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Enrollment end date
 *     responses:
 *       201:
 *         description: Enrollment created successfully
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
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/enrollmentforTeacher", isUser, enrollmentforTeacher);

/**
 * @swagger
 * /api/enrollment/getChapter/{chapterId}:
 *   get:
 *     summary: Get chapter details
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getChapter/:chapterId", isUser, chapterDetails);

/**
 * @swagger
 * /api/enrollment/getChapterstdpre/{chapterId}:
 *   get:
 *     summary: Get chapter details for student preview
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter details for student preview retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getChapterstdpre/:chapterId", isUser, chapterDetailsStdPre);

/**
 * @swagger
 * /api/enrollment/unenroll/{courseId}:
 *   delete:
 *     summary: Unenroll from a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to unenroll from
 *     responses:
 *       200:
 *         description: Unenrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Course not found or not enrolled
 *       401:
 *         description: Unauthorized
 */
router.delete("/unenroll/:courseId", isUser, unEnrollment);

// Parent route

export default router;
