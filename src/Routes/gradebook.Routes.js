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

/**
 * @swagger
 * /api/gradebook/getGradebook/{studentId}/{courseId}:
 *   get:
 *     summary: Get student gradebook for specific course
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Student gradebook retrieved
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     assessments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           assessment:
 *                             $ref: '#/components/schemas/Assessment'
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           grade:
 *                             type: string
 *                     overallGrade:
 *                       type: string
 *                     overallPercentage:
 *                       type: number
 *       404:
 *         description: Student or course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getGradebook/:studentId/:courseId", isUser, getStudentGradebook);

/**
 * @swagger
 * /api/gradebook/getOverallGradeReport:
 *   get:
 *     summary: Get overall grade report for current student
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall grade report retrieved
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           overallGrade:
 *                             type: string
 *                           overallPercentage:
 *                             type: number
 *                           credits:
 *                             type: number
 *                     gpa:
 *                       type: number
 *                     totalCredits:
 *                       type: number
 *                     academicStanding:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/getOverallGradeReport", isUser, getStudentGradeReport);

/**
 * @swagger
 * /api/gradebook/gradingScale:
 *   post:
 *     summary: Set grading scale for course
 *     tags: [Gradebook]
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
 *               - scale
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               scale:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     minScore:
 *                       type: number
 *                     maxScore:
 *                       type: number
 *                     grade:
 *                       type: string
 *                     description:
 *                       type: string
 *                 description: Grading scale array
 *     responses:
 *       201:
 *         description: Grading scale set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/gradingScale", isUser, setGradingScale);

/**
 * @swagger
 * /api/gradebook/getGradingScale:
 *   get:
 *     summary: Get grading scale for course
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Grading scale retrieved
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
 *                       minScore:
 *                         type: number
 *                       maxScore:
 *                         type: number
 *                       grade:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/getGradingScale", isUser, getGradingScale);

/**
 * @swagger
 * /api/gradebook/course/{courseId}:
 *   get:
 *     summary: Get gradebook for all students in course
 *     tags: [Gradebook]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course gradebook retrieved
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
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           overallGrade:
 *                             type: string
 *                           overallPercentage:
 *                             type: number
 *                           assessmentCount:
 *                             type: integer
 *       404:
 *         description: Course not found
 */
router.get("/course/:courseId", getGradebookForCourse);

/**
 * @swagger
 * /api/gradebook/getTeacherStudentAnalytics/{courseId}/{studentId}:
 *   get:
 *     summary: Get detailed analytics for specific student in course
 *     tags: [Gradebook]
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
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student analytics retrieved
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     performance:
 *                       type: object
 *                       properties:
 *                         averageScore:
 *                           type: number
 *                         gradeTrend:
 *                           type: string
 *                           enum: [improving, declining, stable]
 *                         submissionRate:
 *                           type: number
 *                         lateSubmissions:
 *                           type: integer
 *                     assessmentBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           assessment:
 *                             $ref: '#/components/schemas/Assessment'
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                           submittedOnTime:
 *                             type: boolean
 *       404:
 *         description: Student or course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getTeacherStudentAnalytics/:courseId/:studentId", isUser, getTeacherStudentAnalytics);

/**
 * @swagger
 * /api/gradebook/getStudentGradebooksFormattedAnalytics:
 *   get:
 *     summary: Get formatted analytics for student gradebooks
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student gradebook analytics retrieved
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
 *                     overallGPA:
 *                       type: number
 *                     totalCourses:
 *                       type: integer
 *                     completedCourses:
 *                       type: integer
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           grade:
 *                             type: string
 *                           credits:
 *                             type: number
 *                           status:
 *                             type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/getStudentGradebooksFormattedAnalytics", isUser, getStudentGradebooksFormattedAnalytics);

//////updated APIS

/**
 * @swagger
 * /api/gradebook/getStudentGradebooksFormatted:
 *   get:
 *     summary: Get formatted gradebooks for current student
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student gradebooks retrieved in formatted structure
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
 *                     gradebooks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           assessments:
 *                             type: array
 *                           overallGrade:
 *                             type: string
 *                           overallPercentage:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/getStudentGradebooksFormatted", isUser, getStudentGradebooksFormatted)

/**
 * @swagger
 * /api/gradebook/getGradebooksOfCourseFormatted/{courseId}:
 *   get:
 *     summary: Get formatted gradebooks for all students in course
 *     tags: [Gradebook]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course gradebooks retrieved in formatted structure
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
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           assessments:
 *                             type: array
 *                           overallGrade:
 *                             type: string
 *                           overallPercentage:
 *                             type: number
 *       404:
 *         description: Course not found
 */
router.get("/getGradebooksOfCourseFormatted/:courseId", isUser, getGradebooksOfCourseFormatted)

/**
 * @swagger
 * /api/gradebook/getGradebooksOfStudentCourseFormatted/{studentId}/{courseId}:
 *   get:
 *     summary: Get formatted gradebook for specific student and course
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Student course gradebook retrieved in formatted structure
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     assessments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           assessment:
 *                             $ref: '#/components/schemas/Assessment'
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           grade:
 *                             type: string
 *                     overallGrade:
 *                       type: string
 *                     overallPercentage:
 *                       type: number
 *       404:
 *         description: Student or course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getGradebooksOfStudentCourseFormatted/:studentId/:courseId", isUser, getGradebooksOfStudentCourseFormatted)

export default router;
