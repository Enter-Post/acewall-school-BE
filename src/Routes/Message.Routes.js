import express from "express";
import {
  createMessage,
  getConversationMessages,
} from "../Contollers/message.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { createMessage_updated, getAllUnreadCounts, getConversationMessages_updated, markMessagesAsRead_updated } from "../Contollers/UPDATED_API_CONTROLLER/message.controller.web.js";

const router = express.Router();

/**
 * @swagger
 * /api/messeges/create/{conversationId}:
 *   post:
 *     summary: Create a new message in conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
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
 *                 description: Message content
 *               messageType:
 *                 type: string
 *                 enum: [text, file, image]
 *                 description: Type of message
 *               replyTo:
 *                 type: string
 *                 description: Message ID being replied to (optional)
 *     responses:
 *       201:
 *         description: Message created successfully
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
 *                     sender:
 *                       $ref: '#/components/schemas/User'
 *                     conversation:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.post("/create/:conversationId", isUser, createMessage);

/**
 * @swagger
 * /api/messeges/get/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
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
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           sender:
 *                             $ref: '#/components/schemas/User'
 *                           messageType:
 *                             type: string
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
 *                         totalMessages:
 *                           type: integer
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:conversationId", isUser, getConversationMessages);

//// updated-apis

/**
 * @swagger
 * /api/messeges/create_updated/{conversationId}:
 *   post:
 *     summary: Create message (updated version)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
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
 *                 description: Message content
 *               messageType:
 *                 type: string
 *                 enum: [text, file, image]
 *                 description: Type of message
 *               replyTo:
 *                 type: string
 *                 description: Message ID being replied to (optional)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     url:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                 description: Message attachments (optional)
 *     responses:
 *       201:
 *         description: Message created successfully
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
 *                     sender:
 *                       $ref: '#/components/schemas/User'
 *                     attachments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.post("/create_updated/:conversationId", isUser, createMessage_updated);

/**
 * @swagger
 * /api/messeges/get_updated/{conversationId}:
 *   get:
 *     summary: Get messages in conversation (updated version)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
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
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           sender:
 *                             $ref: '#/components/schemas/User'
 *                           messageType:
 *                             type: string
 *                           attachments:
 *                             type: array
 *                           isRead:
 *                             type: boolean
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
 *                         totalMessages:
 *                           type: integer
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get_updated/:conversationId", isUser, getConversationMessages_updated);

/**
 * @swagger
 * /api/messeges/markAsRead_updated/{conversationId}:
 *   post:
 *     summary: Mark messages as read in conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of message IDs to mark as read
 *               markAll:
 *                 type: boolean
 *                 description: Mark all messages in conversation as read
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 */
router.post("/markAsRead_updated/:conversationId", isUser, markMessagesAsRead_updated);

/**
 * @swagger
 * /api/messeges/getUnreadCount:
 *   get:
 *     summary: Get unread message counts for current user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message counts retrieved
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
 *                     totalUnread:
 *                       type: integer
 *                       description: Total unread messages across all conversations
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           conversationId:
 *                             type: string
 *                           unreadCount:
 *                             type: integer
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               content:
 *                                 type: string
 *                               sender:
 *                                 $ref: '#/components/schemas/User'
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/getUnreadCount", isUser, getAllUnreadCounts);

export default router;
