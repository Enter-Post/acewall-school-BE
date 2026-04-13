import express from "express";
import {
  getReplyCount,
  getreplyofComment,
  sendReplyofComment,
} from "../../Contollers/Discussion/replyDiscussion.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/reply-discussion/send/{commentId}:
 *   post:
 *     summary: Send a reply to a discussion comment
 *     tags: [Reply Discussion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Reply content
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to post anonymously
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to mention
 *     responses:
 *       201:
 *         description: Reply sent successfully
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
 *                     content:
 *                       type: string
 *                     author:
 *                       $ref: '#/components/schemas/User'
 *                     comment:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         content:
 *                           type: string
 *                     isAnonymous:
 *                       type: boolean
 *                     mentions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     likes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.post("/send/:commentId", isUser, sendReplyofComment);

/**
 * @swagger
 * /api/reply-discussion/get/{commentId}:
 *   get:
 *     summary: Get replies for a comment
 *     tags: [Reply Discussion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
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
 *         description: Number of replies per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, most_liked]
 *           default: newest
 *         description: Sort replies by
 *     responses:
 *       200:
 *         description: Replies retrieved
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
 *                     comment:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         content:
 *                           type: string
 *                         author:
 *                           $ref: '#/components/schemas/User'
 *                     replies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           author:
 *                             $ref: '#/components/schemas/User'
 *                           isAnonymous:
 *                             type: boolean
 *                           mentions:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           likes:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           likeCount:
 *                             type: integer
 *                           isLiked:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalReplies:
 *                           type: integer
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:commentId", isUser, getreplyofComment);

/**
 * @swagger
 * /api/reply-discussion/replycount/{commentId}:
 *   get:
 *     summary: Get reply count for a comment
 *     tags: [Reply Discussion]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Reply count retrieved
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
 *                     commentId:
 *                       type: string
 *                     replyCount:
 *                       type: integer
 *                     lastReplyAt:
 *                       type: string
 *                       format: date-time
 *                     recentReplies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           author:
 *                             $ref: '#/components/schemas/User'
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Comment not found
 */
router.get("/replycount/:commentId", getReplyCount);

export default router;
