import express from "express";
import { getChildrenData } from "../Contollers/auth.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getChildCourseAnalyticsForParent, getChildGradebookForParent } from "../Contollers/gradebookUpdated.controller.js";
import { getChildEnrolledCourses, getParentChildCourseDetails } from "../Contollers/enrollment.controller.js";
import { getAnnouncementsForParent } from "../Contollers/announcement.controller.js";
import { getAllAssessmentForParent } from "../Contollers/Assessment.controller.js";
import { getAssessmentSubmissionForParent } from "../Contollers/Submission.controller.js";
import { sendSupportMail } from "../Contollers/Support.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/parent/my-children:
 *   get:
 *     summary: Get parent's children data
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent's children retrieved
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
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       grade:
 *                         type: string
 *                       school:
 *                         type: string
 *                       enrollmentStatus:
 *                         type: string
 *                         enum: [active, inactive, pending]
 *       401:
 *         description: Unauthorized
 */
router.get("/my-children", isUser, getChildrenData);

/**
 * @swagger
 * /api/parent/child-gradebook/{studentId}:
 *   get:
 *     summary: Get child's gradebook for parent view
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester (optional)
 *     responses:
 *       200:
 *         description: Child's gradebook retrieved
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
 *                     gradebook:
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
 *                           assessments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 assessment:
 *                                   $ref: '#/components/schemas/Assessment'
 *                                 score:
 *                                   type: number
 *                                 maxScore:
 *                                   type: number
 *                                 grade:
 *                                   type: string
 *                     gpa:
 *                       type: number
 *       404:
 *         description: Student not found or not authorized
 *       401:
 *         description: Unauthorized
 */
router.get("/child-gradebook/:studentId", isUser, getChildGradebookForParent);

/**
 * @swagger
 * /api/parent/getChildCourseAnalytics/{studentId}/{courseId}:
 *   get:
 *     summary: Get child's course analytics for parent view
 *     tags: [Parent]
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
 *         description: Child's course analytics retrieved
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
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         attendanceRate:
 *                           type: number
 *                         averageScore:
 *                           type: number
 *                         gradeTrend:
 *                           type: string
 *                           enum: [improving, declining, stable]
 *                         submissionRate:
 *                           type: number
 *                         lastActivity:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Student or course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getChildCourseAnalytics/:studentId/:courseId", isUser, getChildCourseAnalyticsForParent);

/**
 * @swagger
 * /api/parent/child-courses/{studentId}:
 *   get:
 *     summary: Get child's enrolled courses for parent view
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, all]
 *           default: active
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: Child's enrolled courses retrieved
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
 *                           enrollment:
 *                             $ref: '#/components/schemas/Enrollment'
 *                           progress:
 *                             type: object
 *                             properties:
 *                               completionPercentage:
 *                                 type: number
 *                               lastAccessed:
 *                                 type: string
 *                                 format: date-time
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/child-courses/:studentId", isUser, getChildEnrolledCourses);

/**
 * @swagger
 * /api/parent/child-course-details/{studentId}/{enrollmentId}:
 *   get:
 *     summary: Get detailed course information for parent view
 *     tags: [Parent]
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
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Child's course details retrieved
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
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 *                     progress:
 *                       type: object
 *                       properties:
 *                         completionPercentage:
 *                           type: number
 *                         completedLessons:
 *                           type: integer
 *                         totalLessons:
 *                           type: integer
 *                         averageScore:
 *                           type: number
 *                         lastAccessed:
 *                           type: string
 *                           format: date-time
 *                     upcomingAssessments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Student or enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/child-course-details/:studentId/:enrollmentId", 
  isUser, 
  getParentChildCourseDetails
);

/**
 * @swagger
 * /api/parent/get-child-announcements/{studentId}:
 *   get:
 *     summary: Get announcements for parent's child
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
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
 *           default: 10
 *         description: Number of announcements per page
 *     responses:
 *       200:
 *         description: Child's announcements retrieved
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
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalAnnouncements:
 *                           type: integer
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get-child-announcements/:studentId", isUser, getAnnouncementsForParent);

/**
 * @swagger
 * /api/parent/get-child-assessments/{studentId}:
 *   get:
 *     summary: Get assessments for parent's child
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, all]
 *           default: all
 *         description: Filter by assessment status
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
 *           default: 10
 *         description: Number of assessments per page
 *     responses:
 *       200:
 *         description: Child's assessments retrieved
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
 *                     assessments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           assessment:
 *                             $ref: '#/components/schemas/Assessment'
 *                           submission:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               score:
 *                                 type: number
 *                               maxScore:
 *                                 type: number
 *                               submittedAt:
 *                                 type: string
 *                                 format: date-time
 *                               status:
 *                                 type: string
 *                                 enum: [submitted, graded, pending]
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalAssessments:
 *                           type: integer
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get-child-assessments/:studentId", isUser, getAllAssessmentForParent);

/**
 * @swagger
 * /api/parent/submission-detail/{studentId}/{assessmentId}:
 *   get:
 *     summary: Get assessment submission details for parent view
 *     tags: [Parent]
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
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment submission details retrieved
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
 *                     assessment:
 *                       $ref: '#/components/schemas/Assessment'
 *                     submission:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         answers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               questionId:
 *                                 type: string
 *                               answer:
 *                                 type: string
 *                               score:
 *                                 type: number
 *                         files:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               filename:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                         score:
 *                           type: number
 *                         maxScore:
 *                           type: number
 *                         percentage:
 *                           type: number
 *                         grade:
 *                           type: string
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *                         gradedAt:
 *                           type: string
 *                           format: date-time
 *                         feedback:
 *                           type: string
 *       404:
 *         description: Student or assessment not found
 *       401:
 *         description: Unauthorized
 */
router.get("/submission-detail/:studentId/:assessmentId", isUser, getAssessmentSubmissionForParent);

/**
 * @swagger
 * /api/parent/send:
 *   post:
 *     summary: Send support request from parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Parent's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Parent's email address
 *               subject:
 *                 type: string
 *                 description: Support request subject
 *               message:
 *                 type: string
 *                 description: Support request message
 *               childId:
 *                 type: string
 *                 description: Child's student ID (optional)
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Support request priority
 *               category:
 *                 type: string
 *                 enum: [academic, technical, billing, behavioral]
 *                 description: Support request category
 *     responses:
 *       200:
 *         description: Support request sent successfully
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
 *                     ticketId:
 *                       type: string
 *                     estimatedResponseTime:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/send", sendSupportMail);

export default router;