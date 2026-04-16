import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";
import {
  getSubmissionById,
  getSubmissionsforStudent,
  getSubmissionsofAssessment_forTeacher,
  submission,
  teacherGrading,
} from "../Contollers/Submission.controller.js";
import { upload } from "../lib/multer.config.js";
import { isEnrolledMiddleware } from "../middlewares/isEnrolled.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/assessmentSubmission/submission/{assessmentId}:
 *   post:
 *     summary: Submit assessment files and answers
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID to submit to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Assessment submission files
 *               answers:
 *                 type: object
 *                 description: Assessment answers (JSON string)
 *               submissionText:
 *                 type: string
 *                 description: Text-based submission answers
 *     responses:
 *       201:
 *         description: Assessment submitted successfully
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
 *                     _id:
 *                       type: string
 *                     assessment:
 *                       $ref: '#/components/schemas/Assessment'
 *                     student:
 *                       $ref: '#/components/schemas/User'
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           url:
 *                             type: string
 *                           mimetype:
 *                             type: string
 *                           size:
 *                             type: number
 *       400:
 *         description: Invalid submission data
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/submission/:assessmentId",
  isUser,
  upload.array("files"),
  submission
);

router.post(
  "/submission/v2/:assessmentId/:courseId",
  isUser,
  isEnrolledMiddleware,
  upload.array("files"),
  submission
);

/**
 * @swagger
 * /api/assessmentSubmission/submission/{submissionId}:
 *   get:
 *     summary: Get submission details by ID
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission details retrieved
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
 *                     _id:
 *                       type: string
 *                     assessment:
 *                       $ref: '#/components/schemas/Assessment'
 *                     student:
 *                       $ref: '#/components/schemas/User'
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     score:
 *                       type: number
 *                     maxScore:
 *                       type: number
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           url:
 *                             type: string
 *                           mimetype:
 *                             type: string
 *                           size:
 *                             type: number
 *                     answers:
 *                       type: object
 *                     gradedAt:
 *                       type: string
 *                       format: date-time
 *                     feedback:
 *                       type: string
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 */
router.get("/submission/v2/:submissionId", isUser, isEnrolledMiddleware, getSubmissionById);
router.get("/submission/:submissionId", isUser, getSubmissionById);

/**
 * @swagger
 * /api/assessmentSubmission/submission_for_Teacher/{assessmentId}:
 *   get:
 *     summary: Get all submissions for an assessment (teacher view)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, graded, not_submitted]
 *           description: Filter by submission status
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
 *         description: Number of submissions per page
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
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
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [submitted, graded, late]
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalSubmissions:
 *                           type: integer
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/submission_for_Teacher/:assessmentId",
  isUser,
  getSubmissionsofAssessment_forTeacher
);

/**
 * @swagger
 * /api/assessmentSubmission/submissions/{studentId}:
 *   get:
 *     summary: Get all submissions for a student
 *     tags: [Submissions]
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
 *           default: 20
 *         description: Number of submissions per page
 *     responses:
 *       200:
 *         description: Student submissions retrieved successfully
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
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           assessment:
 *                             $ref: '#/components/schemas/Assessment'
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           gradedAt:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [submitted, graded, late]
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalSubmissions:
 *                           type: integer
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/submissions/:studentId", isUser, getSubmissionsforStudent);

/**
 * @swagger
 * /api/assessmentSubmission/teacherGrading/{submissionId}:
 *   put:
 *     summary: Grade a student submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID to grade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *               - maxScore
 *             properties:
 *               score:
 *                 type: number
 *                 description: Score awarded to student
 *               maxScore:
 *                 type: number
 *                 description: Maximum possible score
 *               feedback:
 *                 type: string
 *                 description: Teacher feedback on submission
 *               status:
 *                 type: string
 *                 enum: [graded, needs_revision, excellent]
 *                 description: Grading status
 *     responses:
 *       200:
 *         description: Submission graded successfully
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
 *                     _id:
 *                       type: string
 *                     score:
 *                       type: number
 *                     maxScore:
 *                       type: number
 *                     feedback:
 *                       type: string
 *                     gradedAt:
 *                       type: string
 *                       format: date-time
 *                     gradedBy:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid grading data
 *       404:
 *         description: Submission not found
 *       401:
 *         description: Unauthorized
 */
router.put("/teacherGrading/:submissionId", isUser, teacherGrading);

export default router;
