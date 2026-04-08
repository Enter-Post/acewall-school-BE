import { getGuardianEmailPreferences, updateGuardianEmailPreferences } from "../Contollers/emailNotification.controller.js"
import express from "express"
import { isUser } from "../middlewares/Auth.Middleware.js"

const router = express.Router();

/**
 * @swagger
 * /api/email-notification/get/{studentId}:
 *   get:
 *     summary: Get guardian email preferences for a student
 *     tags: [Email Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Guardian email preferences retrieved
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
 *                     guardianEmailPreferences:
 *                       type: object
 *                       properties:
 *                         academicUpdates:
 *                           type: boolean
 *                           description: Receive academic progress updates
 *                         attendanceAlerts:
 *                           type: boolean
 *                           description: Receive attendance alerts
 *                         gradeUpdates:
 *                           type: boolean
 *                           description: Receive grade updates
 *                         assessmentReminders:
 *                           type: boolean
 *                           description: Receive assessment reminders
 *                         behaviorReports:
 *                           type: boolean
 *                           description: Receive behavior reports
 *                         schoolAnnouncements:
 *                           type: boolean
 *                           description: Receive school announcements
 *                         emergencyAlerts:
 *                           type: boolean
 *                           description: Receive emergency alerts
 *                         weeklySummary:
 *                           type: boolean
 *                           description: Receive weekly summary reports
 *                         monthlyReport:
 *                           type: boolean
 *                           description: Receive monthly progress reports
 *                         emailFrequency:
 *                           type: string
 *                           enum: [immediate, daily, weekly, monthly]
 *                           description: Email delivery frequency
 *                         guardianEmails:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: List of guardian email addresses
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Student not found
 *       403:
 *         description: Not authorized to view this student's preferences
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:studentId", isUser, getGuardianEmailPreferences);

/**
 * @swagger
 * /api/email-notification/update/{studentId}:
 *   put:
 *     summary: Update guardian email preferences for a student
 *     tags: [Email Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
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
 *             properties:
 *               academicUpdates:
 *                 type: boolean
 *                 description: Receive academic progress updates
 *               attendanceAlerts:
 *                 type: boolean
 *                 description: Receive attendance alerts
 *               gradeUpdates:
 *                 type: boolean
 *                 description: Receive grade updates
 *               assessmentReminders:
 *                 type: boolean
 *                 description: Receive assessment reminders
 *               behaviorReports:
 *                 type: boolean
 *                 description: Receive behavior reports
 *               schoolAnnouncements:
 *                 type: boolean
 *                 description: Receive school announcements
 *               emergencyAlerts:
 *                 type: boolean
 *                 description: Receive emergency alerts
 *               weeklySummary:
 *                 type: boolean
 *                 description: Receive weekly summary reports
 *               monthlyReport:
 *                 type: boolean
 *                 description: Receive monthly progress reports
 *               emailFrequency:
 *                 type: string
 *                 enum: [immediate, daily, weekly, monthly]
 *                 description: Email delivery frequency
 *               guardianEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of guardian email addresses
 *     responses:
 *       200:
 *         description: Guardian email preferences updated successfully
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
 *                     studentId:
 *                       type: string
 *                     guardianEmailPreferences:
 *                       type: object
 *                       properties:
 *                         academicUpdates:
 *                           type: boolean
 *                         attendanceAlerts:
 *                           type: boolean
 *                         gradeUpdates:
 *                           type: boolean
 *                         assessmentReminders:
 *                           type: boolean
 *                         behaviorReports:
 *                           type: boolean
 *                         schoolAnnouncements:
 *                           type: boolean
 *                         emergencyAlerts:
 *                           type: boolean
 *                         weeklySummary:
 *                           type: boolean
 *                         monthlyReport:
 *                           type: boolean
 *                         emailFrequency:
 *                           type: string
 *                         guardianEmails:
 *                           type: array
 *                           items:
 *                             type: string
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Student not found
 *       403:
 *         description: Not authorized to update this student's preferences
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.put("/update/:studentId", isUser, updateGuardianEmailPreferences);

export default router;