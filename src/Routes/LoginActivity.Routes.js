import express from "express"
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getLoginActivityofStudent } from "../Contollers/loginActivity.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/login-activity/getLoginActivityofStudent/{userId}:
 *   get:
 *     summary: Get login activity for a specific student
 *     tags: [Login Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for activity range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for activity range (YYYY-MM-DD)
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
 *         description: Number of activities per page
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [all, login, logout, session_start, session_end]
 *           default: all
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Student login activity retrieved
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
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           activityType:
 *                             type: string
 *                             enum: [login, logout, session_start, session_end]
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           ipAddress:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           device:
 *                             type: string
 *                           browser:
 *                             type: string
 *                           location:
 *                             type: object
 *                             properties:
 *                               country:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                           sessionDuration:
 *                             type: integer
 *                             description: Session duration in minutes
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: integer
 *                         averageSessionDuration:
 *                           type: number
 *                         totalLoginTime:
 *                           type: number
 *                           description: Total time logged in (hours)
 *                         lastLogin:
 *                           type: string
 *                           format: date-time
 *                         lastLogout:
 *                           type: string
 *                           format: date-time
 *                         activeSessions:
 *                           type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalActivities:
 *                           type: integer
 *       404:
 *         description: Student not found
 *       403:
 *         description: Not authorized to view this student's activity
 *       401:
 *         description: Unauthorized
 */
router.get("/getLoginActivityofStudent/:userId", isUser, getLoginActivityofStudent);

export default router;