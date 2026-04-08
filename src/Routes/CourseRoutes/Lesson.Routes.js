import express from "express";
import {
  addMoreFiles,
  createLesson,
  deleteFile,
  deleteLesson,
  editLesson,
  getallFilesofLesson,
  getLessons,
} from "../../Contollers/CourseControllers/lesson.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { upload } from "../../lib/multer.config.js";

const router = express.Router();

/**
 * @swagger
 * /api/lesson/create:
 *   post:
 *     summary: Create a new lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - chapterId
 *               - courseId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Lesson title
 *               content:
 *                 type: string
 *                 description: Lesson content
 *               chapterId:
 *                 type: string
 *                 description: Chapter ID
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               order:
 *                 type: number
 *                 description: Lesson order in chapter
 *               videoUrl:
 *                 type: string
 *                 description: Lesson video URL
 *               pdfFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: PDF files for the lesson
 *     responses:
 *       201:
 *         description: Lesson created successfully
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
 *                   $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/create", isUser, upload.array("pdfFiles"), createLesson);

/**
 * @swagger
 * /api/lesson/{chapterId}:
 *   get:
 *     summary: Get lessons for a chapter
 *     tags: [Lessons]
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
 *         description: List of lessons for chapter
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
 *                     $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.get(":chapterId", isUser, getLessons);

/**
 * @swagger
 * /api/lesson/{lessonId}:
 *   delete:
 *     summary: Delete a lesson by ID
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID to delete
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lesson not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:lessonId", isUser, deleteLesson);

/**
 * @swagger
 * /api/lesson/edit/{lessonId}:
 *   put:
 *     summary: Update a lesson by ID
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated lesson title
 *               content:
 *                 type: string
 *                 description: Updated lesson content
 *               order:
 *                 type: number
 *                 description: Updated lesson order
 *               videoUrl:
 *                 type: string
 *                 description: Updated lesson video URL
 *     responses:
 *       200:
 *         description: Lesson updated successfully
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
 *                   $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Lesson not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.put("/edit/:lessonId", isUser, editLesson);

/**
 * @swagger
 * /api/lesson/delete/{lessonId}/{fileId}:
 *   delete:
 *     summary: Delete a specific file from a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lesson or file not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:lessonId/:fileId", isUser, deleteFile);

/**
 * @swagger
 * /api/lesson/getallFilesofLesson/{lessonId}:
 *   get:
 *     summary: Get all files for a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: List of lesson files
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       originalName:
 *                         type: string
 *                       mimetype:
 *                         type: string
 *                       size:
 *                         type: number
 *                       url:
 *                         type: string
 *       404:
 *         description: Lesson not found
 *       401:
 *         description: Unauthorized
 */
router.get(`/getallFilesofLesson/:lessonId`, isUser, getallFilesofLesson);

/**
 * @swagger
 * /api/lesson/addMoreFiles/{lessonId}:
 *   put:
 *     summary: Add more files to an existing lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdfFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional PDF files to add
 *     responses:
 *       200:
 *         description: Files added successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       url:
 *                         type: string
 *       404:
 *         description: Lesson not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  `/addMoreFiles/:lessonId`,
  isUser,
  upload.array("pdfFiles"),
  addMoreFiles
);

export default router;
