import express from "express";
import { getPostComment, sendPostComment } from "../../Contollers/PostControllers/postComment.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/post-comment/sendComment/{id}:
 *   post:
 *     summary: Send a comment to a post
 *     tags: [Post Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to comment on
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
 *                     post:
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
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.post("/sendComment/:id", isUser, sendPostComment);

/**
 * @swagger
 * /api/post-comment/getPostComment/{id}:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Post Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
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
 *         description: Post comments retrieved
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
 *                     post:
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
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getPostComment/:id", isUser, getPostComment);

export default router;