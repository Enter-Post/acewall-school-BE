import express from "express";
import activityLogController from "../Controllers/activityLog.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Activity logging and analytics
 */

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create a new log entry
 *     tags: [Activity Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - event
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [click, page_view, form_submit, action, error]
 *               event:
 *                 type: string
 *               page:
 *                 type: string
 *               metadata:
 *                 type: object
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       202:
 *         description: Log received successfully
 *       400:
 *         description: Missing required fields
 */
router.post("/", isUser, activityLogController.createLogEntry);

/**
 * @swagger
 * /api/logs/batch:
 *   post:
 *     summary: Create multiple log entries (batch)
 *     tags: [Activity Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logs
 *             properties:
 *               logs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     event:
 *                       type: string
 *                     page:
 *                       type: string
 *                     metadata:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *     responses:
 *       202:
 *         description: Logs received successfully
 */
router.post("/batch", isUser, activityLogController.createBatchLogs);

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get logs with filtering (admin only)
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of logs with pagination
 */
router.get("/", isUser, activityLogController.getLogs);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics (admin only)
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Log statistics
 */
router.get("/stats", isUser, activityLogController.getLogStats);

/**
 * @swagger
 * /api/logs/my-activity:
 *   get:
 *     summary: Get current user's activity
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: User's activity logs
 */
router.get("/my-activity", isUser, activityLogController.getMyActivity);

/**
 * @swagger
 * /api/logs/user/{userId}/summary:
 *   get:
 *     summary: Get activity summary for a specific user (admin only)
 *     tags: [Activity Logs]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: User activity summary
 */
router.get("/user/:userId/summary", isUser, activityLogController.getUserActivitySummary);

/**
 * @swagger
 * /api/logs/cleanup:
 *   delete:
 *     summary: Cleanup old logs (admin only)
 *     tags: [Activity Logs]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 default: 90
 *     responses:
 *       200:
 *         description: Cleanup initiated
 */
router.delete("/cleanup", isUser, activityLogController.cleanupOldLogs);

export default router;
