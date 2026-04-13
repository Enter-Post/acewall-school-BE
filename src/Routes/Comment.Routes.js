import {
  allCommentsofTeacher,
  deleteComment,
  getCourseComments,
  sendComment,
} from "../Contollers/comment.controller.js";
import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/comment/{id}:
 *   get:
 *     summary: Get comments for a course
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
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
 *           enum: [latest, oldest, most_liked]
 *           default: latest
 *         description: Sort comments by
 *     responses:
 *       200:
 *         description: Course comments retrieved
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
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           likes:
 *                             type: integer
 *                           replies:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           isLiked:
 *                             type: boolean
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
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", isUser, getCourseComments);

/**
 * @swagger
 * /api/comment/sendComment/{id}:
 *   post:
 *     summary: Send a comment to a course
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
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
 *               parentId:
 *                 type: string
 *                 description: Parent comment ID for replies (optional)
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to mention
 *     responses:
 *       201:
 *         description: Comment created successfully
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
 *                     likes:
 *                       type: integer
 *                     replies:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.post("/sendComment/:id", isUser, sendComment);

/**
 * @swagger
 * /api/comment/teacher/allComment:
 *   get:
 *     summary: Get all comments for teacher's courses
 *     tags: [Comments]
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
 *         description: Number of comments per page
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, flagged]
 *           default: all
 *         description: Filter by comment status
 *     responses:
 *       200:
 *         description: Teacher's comments retrieved
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
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           likes:
 *                             type: integer
 *                           replies:
 *                             type: integer
 *                           status:
 *                             type: string
 *                             enum: [active, hidden, flagged]
 *                           createdAt:
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
 *       401:
 *         description: Unauthorized
 */
router.get('/teacher/allComment', isUser , allCommentsofTeacher);

/**
 * @swagger
 * /api/comment/{courseId}/comment/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: commentId
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
 *         description: Comment or course not found
 *       403:
 *         description: Not authorized to delete this comment
 *       401:
 *         description: Unauthorized
 */
router.delete('/:courseId/comment/:commentId', isUser, deleteComment);

export default router;
