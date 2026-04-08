import express from "express";
import {
  createAnnouncement,
  getAnnouncementsForCourse,
  getAnnouncementsByTeacher,
  deleteAnnouncement,
  getAnnouncementsForStudent,
} from "../Contollers/announcement.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { upload } from "../lib/multer.config.js";

const router = express.Router();

/**
 * @swagger
 * /api/announcement/getbystudent/{studentId}:
 *   get:
 *     summary: Get announcements for a student
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
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
 *           default: 10
 *         description: Number of announcements per page
 *     responses:
 *       200:
 *         description: Student announcements retrieved
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
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalAnnouncements:
 *                           type: integer
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getbystudent/:studentId", isUser, getAnnouncementsForStudent);

/**
 * @swagger
 * /api/announcement/getannouncementforcourse:
 *   get:
 *     summary: Get announcements for a course
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
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
 *           default: 10
 *         description: Number of announcements per page
 *     responses:
 *       200:
 *         description: Course announcements retrieved
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
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalAnnouncements:
 *                           type: integer
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getannouncementforcourse", isUser, getAnnouncementsForCourse);

/**
 * @swagger
 * /api/announcement/createannouncement:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
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
 *               - courseId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Announcement title
 *               content:
 *                 type: string
 *                 description: Announcement content
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Announcement priority
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Announcement expiry date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Announcement files
 *     responses:
 *       201:
 *         description: Announcement created successfully
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
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/createannouncement",
  isUser,
  upload.any(), createAnnouncement);

/**
 * @swagger
 * /api/announcement/getbyteacher/{teacherId}:
 *   get:
 *     summary: Get announcements created by a teacher
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
 *           default: 10
 *         description: Number of announcements per page
 *     responses:
 *       200:
 *         description: Teacher announcements retrieved
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
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalAnnouncements:
 *                           type: integer
 *       404:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getbyteacher/:teacherId", isUser, getAnnouncementsByTeacher);

/**
 * @swagger
 * /api/announcement/{id}:
 *   delete:
 *     summary: Delete an announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID to delete
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Announcement not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", isUser, deleteAnnouncement);

export default router;
