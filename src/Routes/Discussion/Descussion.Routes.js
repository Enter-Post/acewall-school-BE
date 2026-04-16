import express from "express";
import {
  chapterDiscussions,
  courseDiscussions,
  createDiscussion,
  discussionforStudent,
  getDiscussionbyId,
  getDiscussionsOfTeacher,
  lessonDiscussions,
  setDueDateForStudentsDiscussion,
  toggleAllowResubmission,
} from "../../Contollers/Discussion/discussion.controller.js";
import { upload } from "../../lib/multer.config.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { resolveEnrollmentFromChapter, resolveEnrollmentFromDiscussion } from "../../middlewares/enrollment-resolver.js";
import { isEnrolledMiddleware } from "../../middlewares/isEnrolled.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/discussion/create:
 *   post:
 *     summary: Create a new discussion
 *     tags: [Discussions]
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
 *               - content
 *               - course
 *             properties:
 *               title:
 *                 type: string
 *                 description: Discussion title
 *               content:
 *                 type: string
 *                 description: Discussion content
 *               course:
 *                 type: string
 *                 description: Course ID
 *               chapter:
 *                 type: string
 *                 description: Chapter ID (optional)
 *               lesson:
 *                 type: string
 *                 description: Lesson ID (optional)
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Discussion files
 *     responses:
 *       201:
 *         description: Discussion created successfully
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
 *                   $ref: '#/components/schemas/Discussion'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/create", isUser, upload.array("files"), createDiscussion);

/**
 * @swagger
 * /api/discussion/studentDiscussion:
 *   get:
 *     summary: Get discussions for current student
 *     tags: [Discussions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student's discussions
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
 *                     $ref: '#/components/schemas/Discussion'
 *       401:
 *         description: Unauthorized
 */
router.get("/studentDiscussion", isUser, discussionforStudent);

/**
 * @swagger
 * /api/discussion/chapter/{chapterId}:
 *   get:
 *     summary: Get discussions for a specific chapter
 *     tags: [Discussions]
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
 *         description: List of chapter discussions
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
 *                     $ref: '#/components/schemas/Discussion'
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/chapter/:chapterId", isUser, chapterDiscussions);
router.get("/v2/chapter/:chapterId", isUser, resolveEnrollmentFromChapter, isEnrolledMiddleware, chapterDiscussions);

/**
 * @swagger
 * /api/discussion/lesson/{lessonId}:
 *   get:
 *     summary: Get discussions for a specific lesson
 *     tags: [Discussions]
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
 *         description: List of lesson discussions
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
 *                     $ref: '#/components/schemas/Discussion'
 *       404:
 *         description: Lesson not found
 *       401:
 *         description: Unauthorized
 */
router.get("/lesson/:lessonId", isUser, lessonDiscussions);
router.get("/v2/lesson/:lessonId", isUser, isEnrolledMiddleware, lessonDiscussions);

/**
 * @swagger
 * /api/discussion/course/{courseId}:
 *   get:
 *     summary: Get discussions for a specific course
 *     tags: [Discussions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of course discussions
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
 *                     $ref: '#/components/schemas/Discussion'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/course/:courseId", isUser, courseDiscussions);

/**
 * @swagger
 * /api/discussion/all:
 *   get:
 *     summary: Get all discussions for current teacher
 *     tags: [Discussions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's discussions
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
 *                     $ref: '#/components/schemas/Discussion'
 *       401:
 *         description: Unauthorized
 */
router.get("/all", isUser, getDiscussionsOfTeacher);

/**
 * @swagger
 * /api/discussion/{id}:
 *   get:
 *     summary: Get discussion details by ID
 *     tags: [Discussions]
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
 *         description: Discussion details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Discussion'
 *       404:
 *         description: Discussion not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", isUser, getDiscussionbyId);
router.get("/v2/:id", isUser, resolveEnrollmentFromDiscussion, isEnrolledMiddleware, getDiscussionbyId);
router.put("/setDueDateForStudent/:discussionId", isUser, setDueDateForStudentsDiscussion);
router.put("/toggleAllowResubmission/:discussionId", isUser, toggleAllowResubmission);


export default router;
