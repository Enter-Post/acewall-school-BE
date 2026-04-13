import express from "express";
import {
  createConversation,
  //   getConversationbyId,
  getMyConversations,
  getStudentsByOfTeacher,
  getTeacherCourses,
  getTeacherforStudent,
} from "../Contollers/conversation.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getMyConversations_updated, updateLastSeen } from "../Contollers/UPDATED_API_CONTROLLER/conversation-controller.web.js";

const router = express.Router();

/**
 * @swagger
 * /api/conversation/create:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to include in conversation
 *               title:
 *                 type: string
 *                 description: Conversation title (optional)
 *               courseId:
 *                 type: string
 *                 description: Course ID for course-related conversation (optional)
 *               type:
 *                 type: string
 *                 enum: [general, course, support, assessment]
 *                 default: general
 *                 description: Conversation type
 *               initialMessage:
 *                 type: string
 *                 description: Initial message to send (optional)
 *     responses:
 *       201:
 *         description: Conversation created successfully
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
 *                     type:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     createdBy:
 *                       $ref: '#/components/schemas/User'
 *                     courseId:
 *                       $ref: '#/components/schemas/Course'
 *                     lastMessage:
 *                       type: object
 *                       properties:
 *                         content:
 *                           type: string
 *                         sender:
 *                           $ref: '#/components/schemas/User'
 *                         timestamp:
 *                           type: string
 *                           format: date-time
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
 *       401:
 *         description: Unauthorized
 */
router.post("/create", isUser, createConversation);

/**
 * @swagger
 * /api/conversation/get:
 *   get:
 *     summary: Get conversations for current user
 *     tags: [Conversation]
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
 *         description: Number of conversations per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, general, course, support, assessment]
 *           default: all
 *         description: Filter by conversation type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, all]
 *           default: all
 *         description: Filter by conversation status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [last_message, created_at, title]
 *           default: last_message
 *         description: Sort conversations by
 *     responses:
 *       200:
 *         description: Conversations retrieved
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
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           type:
 *                             type: string
 *                           participants:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               content:
 *                                 type: string
 *                               sender:
 *                                 $ref: '#/components/schemas/User'
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               isRead:
 *                                 type: boolean
 *                           unreadCount:
 *                             type: integer
 *                           courseId:
 *                             $ref: '#/components/schemas/Course'
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
 *                         totalConversations:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/get", isUser, getMyConversations);

/**
 * @swagger
 * /api/conversation/getTeacherforStudent:
 *   get:
 *     summary: Get teachers available for student to message
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter teachers by course ID (optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search teachers by name or email
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
 *         description: Number of teachers per page
 *     responses:
 *       200:
 *         description: Available teachers retrieved
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
 *                     teachers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           profileImg:
 *                             type: string
 *                           courses:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Course'
 *                           isAvailable:
 *                             type: boolean
 *                             description: Whether teacher is available for messaging
 *                           lastActive:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalTeachers:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/getTeacherforStudent", isUser, getTeacherforStudent);

/**
 * @swagger
 * /api/conversation/get-updated:
 *   get:
 *     summary: Get updated conversations for current user
 *     tags: [Conversation]
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
 *         description: Number of conversations per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, general, course, support, assessment]
 *           default: all
 *         description: Filter by conversation type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, all]
 *           default: all
 *         description: Filter by conversation status
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Get only unread conversations
 *     responses:
 *       200:
 *         description: Updated conversations retrieved
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
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           type:
 *                             type: string
 *                           participants:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               content:
 *                                 type: string
 *                               sender:
 *                                 $ref: '#/components/schemas/User'
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               isRead:
 *                                 type: boolean
 *                               messageType:
 *                                 type: string
 *                                 enum: [text, file, image, system]
 *                           unreadCount:
 *                             type: integer
 *                           courseId:
 *                             $ref: '#/components/schemas/Course'
 *                           isPinned:
 *                             type: boolean
 *                           isMuted:
 *                             type: boolean
 *                           lastSeenAt:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalConversations:
 *                           type: integer
 *                         unreadConversations:
 *                           type: integer
 *                         activeConversations:
 *                           type: integer
 *                         archivedConversations:
 *                           type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalConversations:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/get-updated", isUser, getMyConversations_updated);

/**
 * @swagger
 * /api/conversation/lastSeen/{conversationId}:
 *   patch:
 *     summary: Update last seen timestamp for conversation
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Last seen timestamp updated
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
 *                     conversationId:
 *                       type: string
 *                     lastSeenAt:
 *                       type: string
 *                       format: date-time
 *                     userId:
 *                       type: string
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/lastSeen/:conversationId", isUser, updateLastSeen);

/**
 * @swagger
 * /api/conversation/getStudentsByOfTeacher/{courseId}:
 *   get:
 *     summary: Get students for a teacher's course
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
 *         description: Number of students per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search students by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: active
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: Students retrieved
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
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           enrollment:
 *                             $ref: '#/components/schemas/Enrollment'
 *                           user:
 *                             $ref: '#/components/schemas/User'
 *                           progress:
 *                             type: object
 *                             properties:
 *                               completionPercentage:
 *                                 type: number
 *                               lastAccessed:
 *                                 type: string
 *                                 format: date-time
 *                               averageGrade:
 *                                 type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalStudents:
 *                           type: integer
 *       404:
 *         description: Course not found
 *       403:
 *         description: Not authorized to view students for this course
 *       401:
 *         description: Unauthorized
 */
router.get("/getStudentsByOfTeacher/:courseId", isUser, getStudentsByOfTeacher);

/**
 * @swagger
 * /api/conversation/getTeacherCourses:
 *   get:
 *     summary: Get courses for current teacher
 *     tags: [Conversation]
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
 *         description: Number of courses per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, all]
 *           default: active
 *         description: Filter by course status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search courses by title
 *     responses:
 *       200:
 *         description: Teacher's courses retrieved
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [active, archived, draft]
 *                           enrollmentCount:
 *                             type: integer
 *                           averageRating:
 *                             type: number
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
 *                         totalCourses:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/getTeacherCourses", isUser, getTeacherCourses);

export default router;
