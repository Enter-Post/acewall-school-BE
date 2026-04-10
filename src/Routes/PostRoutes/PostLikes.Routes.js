import express from "express";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { isPostLiked, likePost } from "../../Contollers/PostControllers/postLikes.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/post-likes/like/{id}:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Post Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to like/unlike
 *     responses:
 *       200:
 *         description: Post like status updated successfully
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
 *                     postId:
 *                       type: string
 *                     isLiked:
 *                       type: boolean
 *                       description: Whether the post is now liked
 *                     totalLikes:
 *                       type: integer
 *                       description: Total number of likes on the post
 *                     recentLikes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                       description: Recent users who liked the post
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.post("/like/:id", isUser, likePost);

/**
 * @swagger
 * /api/post-likes/isPostLiked/{id}:
 *   get:
 *     summary: Check if user has liked a post
 *     tags: [Post Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to check
 *     responses:
 *       200:
 *         description: Post like status retrieved
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
 *                     postId:
 *                       type: string
 *                     isLiked:
 *                       type: boolean
 *                       description: Whether the current user has liked this post
 *                     totalLikes:
 *                       type: integer
 *                       description: Total number of likes on the post
 *                     recentLikes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                       description: Recent users who liked the post
 *                     likedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the user liked the post (if liked)
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.get("/isPostLiked/:id", isUser, isPostLiked);

export default router;