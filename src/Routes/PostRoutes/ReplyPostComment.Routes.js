import express from "express";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { sendReplyofComment } from "../../Contollers/PostControllers/replypostcontroller.js";

const router = express.Router();

/**
 * @swagger
 * /api/reply-post-comment/reply/{commentId}:
 *   post:
 *     summary: Send a reply to a post comment
 *     tags: [Reply Post Comment]
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
 *                     parentComment:
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
router.post("/reply/:commentId", isUser, sendReplyofComment);

export default router;