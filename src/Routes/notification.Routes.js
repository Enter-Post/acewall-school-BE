import express from "express";
import { getUserNotifications, markAllAsRead, markAsRead } from "../Contollers/notification.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/notification/get:
 *   get:
 *     summary: Get notifications for current user
 *     tags: [Notifications]
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
 *         description: Number of notifications per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [read, unread, all]
 *           default: all
 *         description: Filter by notification status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assessment, announcement, message, course, system]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: User notifications retrieved
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [read, unread]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           relatedEntity:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalNotifications:
 *                           type: integer
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/get", isUser, getUserNotifications);

/**
 * @swagger
 * /api/notification/mark-all:
 *   put:
 *     summary: Mark all notifications as read for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *                     markedCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.put("/mark-all", isUser, markAllAsRead);

/**
 * @swagger
 * /api/notification/{id}:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *                     status:
 *                       type: string
 *                       enum: [read]
 *                     readAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", isUser, markAsRead);

export default router;