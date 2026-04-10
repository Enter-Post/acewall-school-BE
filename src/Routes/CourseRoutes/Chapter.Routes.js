import express from "express";
import {
  createChapter,
  deleteChapter,
  editChapter,
  getChapterofCourse,
  getChapterOfQuarter,
  getChapterwithLessons,
} from "../../Contollers/CourseControllers/chapter.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { isEnrolledMiddleware } from "../../middlewares/isEnrolled.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/chapter/{courseId}/{quarterId}:
 *   get:
 *     summary: Get chapters for a specific course and quarter
 *     tags: [Chapters]
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
 *         name: quarterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quarter ID
 *     responses:
 *       200:
 *         description: List of chapters for the course and quarter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Course or quarter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:courseId/:quarterId", isUser, isEnrolledMiddleware, getChapterOfQuarter);

/**
 * @swagger
 * /api/chapter/get/{courseId}/{quarterId}:
 *   get:
 *     summary: Get chapters for course and quarter (without enrollment check)
 *     tags: [Chapters]
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
 *         name: quarterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quarter ID
 *     responses:
 *       200:
 *         description: List of chapters for the course and quarter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Course or quarter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:courseId/:quarterId", isUser, getChapterOfQuarter);

/**
 * @swagger
 * /api/chapter/chapter/chapter&lessons/{chapterId}:
 *   get:
 *     summary: Get chapter details with associated lessons
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter details with lessons
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
 *                     chapter:
 *                       $ref: '#/components/schemas/Chapter'
 *                     lessons:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/chapter/chapter&lessons/:chapterId", isUser, getChapterwithLessons);

/**
 * @swagger
 * /api/chapter/create/{courseId}/{quarterId}:
 *   post:
 *     summary: Create a new chapter in a course
 *     tags: [Chapters]
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
 *         name: quarterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quarter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Chapter title
 *               description:
 *                 type: string
 *                 description: Chapter description
 *               order:
 *                 type: number
 *                 description: Chapter order in the course
 *     responses:
 *       201:
 *         description: Chapter created successfully
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
 *                   $ref: '#/components/schemas/Chapter'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Course or quarter not found
 *       401:
 *         description: Unauthorized
 */
router.post("/create/:courseId/:quarterId", isUser, createChapter);

/**
 * @swagger
 * /api/chapter/{chapterId}:
 *   delete:
 *     summary: Delete a chapter by ID
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID to delete
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:chapterId", isUser, deleteChapter);

/**
 * @swagger
 * /api/chapter/edit/{chapterId}:
 *   put:
 *     summary: Update a chapter by ID
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated chapter title
 *               description:
 *                 type: string
 *                 description: Updated chapter description
 *               order:
 *                 type: number
 *                 description: Updated chapter order
 *     responses:
 *       200:
 *         description: Chapter updated successfully
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
 *                   $ref: '#/components/schemas/Chapter'
 *       404:
 *         description: Chapter not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put("/edit/:chapterId", isUser, editChapter);

export default router;
