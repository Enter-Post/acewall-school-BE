import express from "express";
import { createPost, deletePost, getPosts, specificUserPosts } from "../../Contollers/PostControllers/post.controller.js";
import { upload } from "../../lib/DSmulter.config.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/post/:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - courseId
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content/text
 *               courseId:
 *                 type: string
 *                 description: Course ID to post to
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Post files/images
 *               privacy:
 *                 type: string
 *                 enum: [public, course_only, private]
 *                 default: public
 *                 description: Post privacy level
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Post tags
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     assets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           url:
 *                             type: string
 *                           mimetype:
 *                             type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     likes:
 *                       type: integer
 *                     comments:
 *                       type: integer
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/", upload.array("assets"), isUser, createPost);

/**
 * @swagger
 * /api/post/getPosts:
 *   get:
 *     summary: Get posts with filtering and pagination
 *     tags: [Posts]
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
 *         description: Number of posts per page
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, oldest, most_liked, most_commented]
 *           default: latest
 *         description: Sort posts by
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                     posts:
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
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           assets:
 *                             type: array
 *                             items:
 *                               type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           likes:
 *                             type: integer
 *                           comments:
 *                             type: integer
 *                           isLiked:
 *                             type: boolean
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalPosts:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/getPosts", isUser, getPosts);

/**
 * @swagger
 * /api/post/specificUserPosts/{id}:
 *   get:
 *     summary: Get posts by specific user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get posts for
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
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: User posts retrieved
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     posts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           assets:
 *                             type: array
 *                             items:
 *                               type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           likes:
 *                             type: integer
 *                           comments:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalPosts:
 *                           type: integer
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get("/specificUserPosts/:id", isUser, specificUserPosts);

/**
 * @swagger
 * /api/post/deletePost/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Post not found
 *       403:
 *         description: Not authorized to delete this post
 *       401:
 *         description: Unauthorized
 */
router.delete("/deletePost/:postId", isUser, deletePost);

export default router;