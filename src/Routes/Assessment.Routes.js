import express from "express";
import {
  allAssessmentByTeacher,
  createAssessment,
  deleteAssessment,
  deleteFile,
  editAssessmentInfo,
  findReminderTime,
  getAllassessmentforStudent,
  getAssesmentbyID,
  getAssessmentStats,
  sendAssessmentReminder,
  setReminderTime,
  uploadFiles,
} from "../Contollers/Assessment.controller.js";
import { upload } from "../lib/multer.config.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getResultsMiddleware } from "../middlewares/isSubmitted.middleware.js";
import { createAssessment_updated } from "../Contollers/UPDATED_API_CONTROLLER/assessment.controller.web.js";
import { isEnrolledMiddleware } from "../middlewares/isEnrolled.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/assessment/{assessmentId}/send-reminder:
 *   post:
 *     summary: Send assessment reminder to students
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Custom reminder message
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of student IDs to send reminder to
 *     responses:
 *       200:
 *         description: Reminder sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:assessmentId/send-reminder",
  isUser, // ensures that sender is authenticated
  sendAssessmentReminder
);

/**
 * @swagger
 * /api/assessment/stats/{assessmentId}:
 *   get:
 *     summary: Get assessment statistics
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment statistics retrieved
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
 *                     totalSubmissions:
 *                       type: number
 *                     pendingSubmissions:
 *                       type: number
 *                     gradedSubmissions:
 *                       type: number
 *                     averageScore:
 *                       type: number
 *                     submissionRate:
 *                       type: number
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.get("/stats/:assessmentId", isUser, getAssessmentStats);

/**
 * @swagger
 * /api/assessment/create:
 *   post:
 *     summary: Create a new assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - course
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 description: Assessment title
 *               description:
 *                 type: string
 *                 description: Assessment description
 *               course:
 *                 type: string
 *                 description: Course ID
 *               type:
 *                 type: string
 *                 enum: [quiz, assignment, exam, project]
 *                 description: Assessment type
 *               totalPoints:
 *                 type: number
 *                 description: Total points for assessment
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Assessment due date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Assessment files
 *     responses:
 *       201:
 *         description: Assessment created successfully
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
 *                   $ref: '#/components/schemas/Assessment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/create", upload.array("files"), isUser, createAssessment);

/**
 * @swagger
 * /api/assessment/allAssessmentByTeacher:
 *   get:
 *     summary: Get all assessments for current teacher
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's assessments
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
 *       401:
 *         description: Unauthorized
 */
router.get("/allAssessmentByTeacher", isUser, allAssessmentByTeacher);

/**
 * @swagger
 * /api/assessment/getAllassessmentforStudent:
 *   get:
 *     summary: Get all assessments for current student
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student's assessments
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
 *                       assessment:
 *                         $ref: '#/components/schemas/Assessment'
 *                       submissionStatus:
 *                         type: string
 *                         enum: [not_submitted, submitted, graded]
 *                       score:
 *                         type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/getAllassessmentforStudent", isUser, getAllassessmentforStudent);

/**
 * @swagger
 * /api/assessment/delete/{id}:
 *   delete:
 *     summary: Delete an assessment by ID
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID to delete
 *     responses:
 *       200:
 *         description: Assessment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Assessment not found
 */
router.delete("/delete/:id", deleteAssessment);

/**
 * @swagger
 * /api/assessment/uploadFiles/{assessmentId}/{fileId}:
 *   put:
 *     summary: Upload files to an assessment
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
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
 *                 description: Files to upload
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Assessment not found
 */
router.put(
  "/uploadFiles/:assessmentId/:fileId",
  upload.array("files"),
  uploadFiles
);

/**
 * @swagger
 * /api/assessment/deleteFile/{assessmentId}/{fileId}:
 *   delete:
 *     summary: Delete a file from an assessment
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Assessment or file not found
 */
router.delete("/deleteFile/:assessmentId/:fileId", deleteFile);

/**
 * @swagger
 * /api/assessment/{assessmentId}:
 *   get:
 *     summary: Get assessment details by ID (with submission results)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment details with results
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
 *                     assessment:
 *                       $ref: '#/components/schemas/Assessment'
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           score:
 *                             type: number
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:assessmentId", isUser, getResultsMiddleware, getAssesmentbyID);

/**
 * @swagger
 * /api/assessment/editAssessment/{assessmentId}:
 *   put:
 *     summary: Update assessment information
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated assessment title
 *               description:
 *                 type: string
 *                 description: Updated assessment description
 *               totalPoints:
 *                 type: number
 *                 description: Updated total points
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated due date
 *     responses:
 *       200:
 *         description: Assessment updated successfully
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
 *                   $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Assessment not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put("/editAssessment/:assessmentId", isUser, editAssessmentInfo);

/**
 * @swagger
 * /api/assessment/findReminderTime/{assessmentId}:
 *   get:
 *     summary: Get reminder time for assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Reminder time retrieved
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
 *                     reminderTime:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.get("/findReminderTime/:assessmentId", isUser, findReminderTime)

/**
 * @swagger
 * /api/assessment/setReminder/{assessmentId}:
 *   put:
 *     summary: Set reminder time for assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reminderTime
 *             properties:
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *                 description: When to send reminder
 *     responses:
 *       200:
 *         description: Reminder time set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.put("/setReminder/:assessmentId", isUser, setReminderTime)

/**
 * @swagger
 * /api/assessment/assessmentforTeacher/{assessmentId}:
 *   get:
 *     summary: Get assessment details for teacher
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment details for teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Assessment not found
 *       401:
 *         description: Unauthorized
 */
router.get("/assessmentforTeacher/:assessmentId", isUser, getAssesmentbyID);

//updated Assessment routes

/**
 * @swagger
 * /api/assessment/createAssessment/updated:
 *   post:
 *     summary: Create assessment (updated version)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - course
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 description: Assessment title
 *               description:
 *                 type: string
 *                 description: Assessment description
 *               course:
 *                 type: string
 *                 description: Course ID
 *               type:
 *                 type: string
 *                 enum: [quiz, assignment, exam, project]
 *                 description: Assessment type
 *               totalPoints:
 *                 type: number
 *                 description: Total points for assessment
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Assessment due date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Assessment files (any type)
 *     responses:
 *       201:
 *         description: Assessment created successfully
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
 *                   $ref: '#/components/schemas/Assessment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/createAssessment/updated", upload.any(), isUser, createAssessment_updated);

export default router;
