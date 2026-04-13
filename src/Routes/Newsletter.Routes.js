import express from "express";
import { getAllSubscribers, subscribeToNewsletter } from "../Contollers/newsletter.controller.js";
const router = express.Router();

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to subscribe
 *               name:
 *                 type: string
 *                 description: Subscriber name (optional)
 *               preferences:
 *                 type: object
 *                 properties:
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Preferred newsletter categories
 *                   frequency:
 *                     type: string
 *                     enum: [daily, weekly, monthly]
 *                     description: Email frequency preference
 *     responses:
 *       201:
 *         description: Successfully subscribed to newsletter
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
 *                     subscriptionId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, pending, unsubscribed]
 *       400:
 *         description: Invalid input data or email already subscribed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/subscribe', subscribeToNewsletter);

/**
 * @swagger
 * /api/newsletter/subscribers:
 *   get:
 *     summary: Get all newsletter subscribers
 *     tags: [Newsletter]
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
 *         description: Number of subscribers per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, unsubscribed, all]
 *           default: all
 *         description: Filter by subscription status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search subscribers by email or name
 *     responses:
 *       200:
 *         description: Newsletter subscribers retrieved
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
 *                     subscribers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [active, unsubscribed, pending]
 *                           subscribedAt:
 *                             type: string
 *                             format: date-time
 *                           preferences:
 *                             type: object
 *                             properties:
 *                               categories:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               frequency:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalSubscribers:
 *                           type: integer
 *                     totalActive:
 *                       type: integer
 *                     totalUnsubscribed:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/subscribers', getAllSubscribers);

export default router;
