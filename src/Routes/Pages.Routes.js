import express from "express";
import { ChapterPagesforStudent, createpage, deletePage, getAllPages, getStudentPages, lessonPagesforStudent } from "../Contollers/pages.controller.js";
import { upload } from "../lib/multer.config.js";

const router = express.Router();

/**
 * @swagger
 * /api/pages/createpage/{courseId}/{type}/{typeId}:
 *   post:
 *     summary: Create a new educational page
 *     tags: [Pages]
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
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [chapter, lesson, course]
 *         description: Page type
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Type ID (chapter ID, lesson ID, or course ID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Page title
 *               content:
 *                 type: string
 *                 description: Page content (HTML or markdown)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Main page image (optional)
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Supporting files (max 10)
 *               order:
 *                 type: integer
 *                 description: Page display order
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Whether page is publicly accessible
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Page tags for search
 *     responses:
 *       201:
 *         description: Page created successfully
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
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     type:
 *                       type: string
 *                     typeId:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     isPublic:
 *                       type: boolean
 *                     image:
 *                       type: object
 *                       properties:
 *                         filename:
 *                           type: string
 *                         url:
 *                           type: string
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                             url:
 *                               type: string
 *                             size:
 *                               type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course, chapter, or lesson not found
 *       401:
 *         description: Unauthorized
 */
router.post(
   "/createpage/:courseId/:type/:typeId",
   upload.fields([
       { name: "image", maxCount: 1 },
       { name: "files", maxCount: 10 },
   ]),
   createpage
);

/**
 * @swagger
 * /api/pages/{courseId}/{type}/{typeId}:
 *   get:
 *     summary: Get pages for a specific course, chapter, or lesson
 *     tags: [Pages]
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
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [chapter, lesson, course]
 *         description: Page type
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Type ID (chapter ID, lesson ID, or course ID)
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
 *         description: Number of pages per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [order, title, created_at]
 *           default: order
 *         description: Sort pages by
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     type:
 *                       type: string
 *                     typeId:
 *                       type: string
 *                     pages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           order:
 *                             type: integer
 *                           isPublic:
 *                             type: boolean
 *                           image:
 *                             type: object
 *                             properties:
 *                               filename:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                           files:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 filename:
 *                                   type: string
 *                                   url:
 *                                     type: string
 *                                   size:
 *                                     type: integer
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
 *                         totalItems:
 *                           type: integer
 *       404:
 *         description: Course, chapter, or lesson not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:courseId/:type/:typeId", getAllPages);

/**
 * @swagger
 * /api/pages/deletepage/{pageId}:
 *   delete:
 *     summary: Delete an educational page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Page ID to delete
 *     responses:
 *       200:
 *         description: Page deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Page not found
 *       403:
 *         description: Not authorized to delete this page
 *       401:
 *         description: Unauthorized
 */
router.delete("/deletepage/:pageId", deletePage);

/**
 * @swagger
 * /api/pages/studentpages:
 *   get:
 *     summary: Get pages accessible to current student
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course ID
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
 *         description: Number of pages per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search pages by title or content
 *     responses:
 *       200:
 *         description: Student's accessible pages retrieved
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
 *                     pages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           chapter:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                           lesson:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                           order:
 *                             type: integer
 *                           image:
 *                             type: object
 *                             properties:
 *                               filename:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                           files:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 filename:
 *                                   type: string
 *                                   url:
 *                                     type: string
 *                                   size:
 *                                     type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastAccessed:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/studentpages", getStudentPages);

/**
 * @swagger
 * /api/pages/getChapterPages/{chapterId}:
 *   get:
 *     summary: Get pages for a specific chapter
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
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
 *         description: Number of pages per page
 *     responses:
 *       200:
 *         description: Chapter pages retrieved
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
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         course:
 *                           $ref: '#/components/schemas/Course'
 *                     pages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           order:
 *                             type: integer
 *                           image:
 *                             type: object
 *                             properties:
 *                               filename:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                           files:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 filename:
 *                                   type: string
 *                                   url:
 *                                     type: string
 *                                   size:
 *                                     type: integer
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
 *                         totalItems:
 *                           type: integer
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getChapterPages/:chapterId", ChapterPagesforStudent);

/**
 * @swagger
 * /api/pages/getLessonPages/{lessonId}:
 *   get:
 *     summary: Get pages for a specific lesson
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: Lesson ID
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
 *         description: Number of pages per page
 *     responses:
 *       200:
 *         description: Lesson pages retrieved
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
 *                     lesson:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         chapter:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               title:
 *                                 type: string
 *                         course:
 *                           $ref: '#/components/schemas/Course'
 *                     pages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           order:
 *                             type: integer
 *                           image:
 *                             type: object
 *                             properties:
 *                               filename:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                           files:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 filename:
 *                                   type: string
 *                                   url:
 *                                     type: string
 *                                   size:
 *                                     type: integer
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
 *                         totalItems:
 *                           type: integer
 *       404:
 *         description: Lesson not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getLessonPages/:lessonId", lessonPagesforStudent);

export default router;

