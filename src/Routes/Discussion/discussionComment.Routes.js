import express from "express";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import {
  deleteComment,
  getDiscussionComments,
  gradeDiscussionofStd,
  isCommentedInDiscussion,
  sendDiscussionComment,
} from "../../Contollers/Discussion/discussionComment.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/discussion-comment/get/{id}:
 *   get:
 *     summary: Get comments for a discussion
 *     tags: [Discussion Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
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
 *         description: Number of comments per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, most_liked]
 *           default: newest
 *         description: Sort comments by
 *     responses:
 *       200:
 *         description: Discussion comments retrieved
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
 *                     discussion:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         author:
 *                           $ref: '#/components/schemas/User'
 *                     comments:
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
 *                           grade:
 *                             type: object
 *                             properties:
 *                               score:
 *                                 type: number
 *                               maxScore:
 *                                 type: number
 *                               gradedBy:
 *                                 $ref: '#/components/schemas/User'
 *                               gradedAt:
 *                                 type: string
 *                                 format: date-time
 *                               feedback:
 *                                 type: string
 *                           replies:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 content:
 *                                   type: string
 *                                 author:
 *                                   $ref: '#/components/schemas/User'
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
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
 *                         totalComments:
 *                           type: integer
 *       404:
 *         description: Discussion not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:id", isUser, getDiscussionComments);

/**
 * @swagger
 * /api/discussion-comment/sendComment/{id}:
 *   post:
 *     summary: Send a comment to a discussion
 *     tags: [Discussion Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
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
 *                 description: Comment content
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
 *         description: Comment sent successfully
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
 *                     discussion:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
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
 *         description: Discussion not found
 *       401:
 *         description: Unauthorized
 */
router.post("/sendComment/:id", isUser, sendDiscussionComment);

/**
 * @swagger
 * /api/discussion-comment/delete/{id}:
 *   delete:
 *     summary: Delete a discussion comment
 *     tags: [Discussion Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Comment not found
 *       403:
 *         description: Not authorized to delete this comment
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:id", isUser, deleteComment);

/**
 * @swagger
 * /api/discussion-comment/gradeDiscussionofStd/{discID}/{discussionCommentId}:
 *   put:
 *     summary: Grade a student's discussion comment
 *     tags: [Discussion Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discID
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
 *       - in: path
 *         name: discussionCommentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID to grade
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
 *                 minimum: 0
 *                 description: Grade score
 *               maxScore:
 *                 type: number
 *                 minimum: 0
 *                 description: Maximum possible score
 *               feedback:
 *                 type: string
 *                 description: Grade feedback (optional)
 *     responses:
 *       200:
 *         description: Comment graded successfully
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
 *                     commentId:
 *                       type: string
 *                     grade:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: number
 *                         maxScore:
 *                           type: number
 *                         percentage:
 *                           type: number
 *                         gradedBy:
 *                           $ref: '#/components/schemas/User'
 *                         gradedAt:
 *                           type: string
 *                           format: date-time
 *                         feedback:
 *                           type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Discussion or comment not found
 *       403:
 *         description: Not authorized to grade this comment
 *       401:
 *         description: Unauthorized
 */
router.put("/gradeDiscussionofStd/:discID/:discussionCommentId", isUser, gradeDiscussionofStd);

/**
 * @swagger
 * /api/discussion-comment/isCommentedInDiscussion/{id}:
 *   get:
 *     summary: Check if user has commented in a discussion
 *     tags: [Discussion Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Discussion ID
 *     responses:
 *       200:
 *         description: Comment status retrieved
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
 *                     discussionId:
 *                       type: string
 *                     hasCommented:
 *                       type: boolean
 *                     commentCount:
 *                       type: integer
 *                     lastCommentAt:
 *                       type: string
 *                       format: date-time
 *                     commentIds:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Discussion not found
 *       401:
 *         description: Unauthorized
 */
router.get("/isCommentedInDiscussion/:id", isUser, isCommentedInDiscussion);

export default router;
