import express from "express";
import { askAIupdated, generateContentForTeacher, generateImage, getAllBooks, getChatHistory, uploadBook } from "../Contollers/aiChat.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { upload } from "../lib/DSmulter.config.js";

const router = express.Router();

/**
 * @swagger
 * /api/ai-chat/getChatHistory:
 *   get:
 *     summary: Get AI chat history for current user
 *     tags: [AI Chat]
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
 *         description: Number of chat messages per page
 *       - in: query
 *         name: sessionType
 *         schema:
 *           type: string
 *           enum: [general, course_help, content_generation]
 *         description: Filter by session type
 *     responses:
 *       200:
 *         description: Chat history retrieved
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
 *                     chatHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           sessionType:
 *                             type: string
 *                             enum: [general, course_help, content_generation]
 *                           messages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 role:
 *                                   type: string
 *                                   enum: [user, assistant]
 *                                 content:
 *                                   type: string
 *                                 timestamp:
 *                                   type: string
 *                                   format: date-time
 *                                 hasFile:
 *                                   type: boolean
 *                                   description: Whether message includes file attachment
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
 *                         totalMessages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/getChatHistory", isUser, getChatHistory);

/**
 * @swagger
 * /api/ai-chat/askupdated:
 *   post:
 *     summary: Ask AI assistant with file support
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to analyze (optional)
 *               message:
 *                 type: string
 *                 description: Message to AI
 *               context:
 *                 type: string
 *                 description: Additional context for AI (optional)
 *               sessionType:
 *                 type: string
 *                 enum: [general, course_help, content_generation]
 *                 default: general
 *                 description: Type of chat session
 *               courseId:
 *                 type: string
 *                 description: Course ID for course-specific help (optional)
 *               model:
 *                 type: string
 *                 enum: [gpt-3.5-turbo, gpt-4, claude-3]
 *                 default: gpt-3.5-turbo
 *                 description: AI model to use
 *     responses:
 *       200:
 *         description: AI response generated
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
 *                     response:
 *                       type: string
 *                       description: AI assistant's response
 *                     sessionId:
 *                       type: string
 *                       description: Chat session ID
 *                     model:
 *                       type: string
 *                       description: AI model used
 *                     tokensUsed:
 *                       type: integer
 *                       description: Number of tokens used
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                     fileAnalysis:
 *                       type: object
 *                       properties:
 *                         fileName:
 *                           type: string
 *                         fileType:
 *                           type: string
 *                         summary:
 *                           type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/askupdated", upload.single("file"), isUser, askAIupdated);

/**
 * @swagger
 * /api/ai-chat/generateContentForTeacher:
 *   post:
 *     summary: Generate educational content using AI
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - topic
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [lesson_plan, quiz, assignment, presentation, study_guide]
 *                 description: Type of content to generate
 *               topic:
 *                 type: string
 *                 description: Main topic or subject
 *               gradeLevel:
 *                 type: string
 *                 enum: [elementary, middle_school, high_school, college]
 *                 description: Target grade level
 *               duration:
 *                 type: string
 *                 description: Expected duration (e.g., "45 minutes", "2 hours")
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Learning objectives
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available materials
 *               specialInstructions:
 *                 type: string
 *                 description: Special requirements or instructions
 *               language:
 *                 type: string
 *                 default: english
 *                 description: Language for generated content
 *     responses:
 *       200:
 *         description: Content generated successfully
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
 *                     generatedContent:
 *                       type: string
 *                       description: AI-generated educational content
 *                     contentType:
 *                       type: string
 *                     topic:
 *                       type: string
 *                     gradeLevel:
 *                       type: string
 *                     estimatedTime:
 *                       type: string
 *                       description: Estimated preparation time
 *                     materialsNeeded:
 *                       type: array
 *                       items:
 *                         type: string
 *                     assessmentSuggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     tokensUsed:
 *                       type: integer
 *                     model:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/generateContentForTeacher", isUser, generateContentForTeacher);

/**
 * @swagger
 * /api/ai-chat/generateImage:
 *   post:
 *     summary: Generate images using AI
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Description of image to generate
 *               style:
 *                 type: string
 *                 enum: [realistic, artistic, cartoon, diagram, chart]
 *                 default: realistic
 *                 description: Image style
 *               size:
 *                 type: string
 *                 enum: [256x256, 512x512, 1024x1024]
 *                 default: 512x512
 *                 description: Image size
 *               format:
 *                 type: string
 *                 enum: [png, jpg, webp]
 *                 default: png
 *                 description: Image format
 *               quality:
 *                 type: string
 *                 enum: [standard, high]
 *                 default: standard
 *                 description: Image quality
 *     responses:
 *       200:
 *         description: Image generated successfully
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
 *                     imageUrl:
 *                       type: string
 *                       description: URL of generated image
 *                     thumbnailUrl:
 *                       type: string
 *                       description: Thumbnail URL
 *                     prompt:
 *                       type: string
 *                     style:
 *                       type: string
 *                     size:
 *                       type: string
 *                     format:
 *                       type: string
 *                     tokensUsed:
 *                       type: integer
 *                     model:
 *                       type: string
 *                     generationTime:
 *                       type: number
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/generateImage", isUser, generateImage);

/**
 * @swagger
 * /api/ai-chat/uploadBook:
 *   post:
 *     summary: Upload book for AI analysis
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - bookFile
 *             properties:
 *               bookFile:
 *                 type: string
 *                 format: binary
 *                 description: Book file (PDF, EPUB, etc.)
 *               title:
 *                 type: string
 *                 description: Book title (optional, will extract from file if not provided)
 *               author:
 *                 type: string
 *                 description: Book author (optional)
 *               category:
 *                 type: string
 *                 description: Book category (optional)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Book tags (optional)
 *     responses:
 *       201:
 *         description: Book uploaded and processed successfully
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
 *                     bookId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *                     pageCount:
 *                       type: integer
 *                     fileSize:
 *                       type: integer
 *                     format:
 *                       type: string
 *                     summary:
 *                       type: string
 *                       description: AI-generated book summary
 *                     keyTopics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                     processingStatus:
 *                       type: string
 *                       enum: [processing, completed, failed]
 *       400:
 *         description: Invalid file or upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/uploadBook", upload.single("bookFile"), isUser, uploadBook);

/**
 * @swagger
 * /api/ai-chat/getAllBooks:
 *   get:
 *     summary: Get all uploaded books for current user
 *     tags: [AI Chat]
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
 *         description: Number of books per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search books by title or author
 *     responses:
 *       200:
 *         description: User's books retrieved
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
 *                     books:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           author:
 *                             type: string
 *                           category:
 *                             type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           pageCount:
 *                             type: integer
 *                           fileSize:
 *                             type: integer
 *                           format:
 *                             type: string
 *                           summary:
 *                             type: string
 *                           keyTopics:
 *                             type: array
 *                             items:
 *                               type: string
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                           processingStatus:
 *                             type: string
 *                             enum: [processing, completed, failed]
 *                           downloadUrl:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalBooks:
 *                           type: integer
 *                     totalSize:
 *                       type: integer
 *                       description: Total size of all books in bytes
 *       401:
 *         description: Unauthorized
 */
router.get("/getAllBooks", isUser, getAllBooks);

export default router;