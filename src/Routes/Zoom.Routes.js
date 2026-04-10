import express from "express";
import {
  scheduleMeeting,
  getCourseMeetings,
  deleteMeeting,
  joinMeeting,
  getActiveMeetings,
  handleZoomWebhook,
  endMeeting,
  getUpcomingStudentMeeting,
} from "../Contollers/Zoom.Controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/zoom/course/{courseId}:
 *   get:
 *     summary: Get meetings for a specific course
 *     tags: [Zoom]
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
 *           default: 10
 *         description: Number of meetings per page
 *     responses:
 *       200:
 *         description: Course meetings retrieved
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
 *                     meetings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           topic:
 *                             type: string
 *                           startTime:
 *                             type: string
 *                             format: date-time
 *                           duration:
 *                             type: integer
 *                           joinUrl:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [scheduled, started, ended]
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalMeetings:
 *                           type: integer
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/course/:courseId", isUser, getCourseMeetings);

/**
 * @swagger
 * /api/zoom/upcoming:
 *   get:
 *     summary: Get upcoming meetings for current student
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming meetings retrieved
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
 *                       topic:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: integer
 *                       joinUrl:
 *                         type: string
 *                       course:
 *                         $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 */
router.get("/upcoming", isUser, getUpcomingStudentMeeting);

/**
 * @swagger
 * /api/zoom/active:
 *   get:
 *     summary: Get all active meetings for enrolled courses
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active meetings retrieved
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
 *                       topic:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: integer
 *                       joinUrl:
 *                         type: string
 *                       course:
 *                         $ref: '#/components/schemas/Course'
 *                       host:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/active", isUser, getActiveMeetings);

/**
 * @swagger
 * /api/zoom/schedule:
 *   post:
 *     summary: Schedule a new Zoom meeting
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - startTime
 *               - duration
 *               - courseId
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Meeting topic/title
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Meeting start time
 *               duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *                 description: Meeting duration in minutes
 *               courseId:
 *                 type: string
 *                 description: Course ID
 *               password:
 *                 type: string
 *                 description: Meeting password (optional)
 *               agenda:
 *                 type: string
 *                 description: Meeting agenda
 *               settings:
 *                 type: object
 *                 properties:
 *                   muteUponEntry:
 *                     type: boolean
 *                     description: Mute participants upon entry
 *                   waitingRoom:
 *                     type: boolean
 *                     description: Enable waiting room
 *                   autoRecording:
 *                     type: boolean
 *                     description: Auto record meeting
 *     responses:
 *       201:
 *         description: Meeting scheduled successfully
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
 *                     topic:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: integer
 *                     joinUrl:
 *                       type: string
 *                     startUrl:
 *                       type: string
 *                     password:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/schedule", isUser, scheduleMeeting);

/**
 * @swagger
 * /api/zoom/join/{meetingId}:
 *   get:
 *     summary: Join a meeting (Get URL for both Host and Student)
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     responses:
 *       200:
 *         description: Meeting join URL retrieved
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
 *                     joinUrl:
 *                       type: string
 *                     startUrl:
 *                       type: string
 *                     meeting:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         topic:
 *                           type: string
 *                         status:
 *                           type: string
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.get("/join/:meetingId", isUser, joinMeeting);

/**
 * @swagger
 * /api/zoom/{meetingId}:
 *   delete:
 *     summary: Delete a Zoom meeting
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID to delete
 *     responses:
 *       200:
 *         description: Meeting deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:meetingId", isUser, deleteMeeting);

/**
 * @swagger
 * /api/zoom/end/{meetingId}:
 *   put:
 *     summary: End a Zoom meeting manually
 *     tags: [Zoom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID to end
 *     responses:
 *       200:
 *         description: Meeting ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Meeting not found
 *       401:
 *         description: Unauthorized
 */
router.put("/end/:meetingId", isUser, endMeeting);

/**
 * @swagger
 * /api/zoom/webhook:
 *   post:
 *     summary: Zoom webhook endpoint for meeting events
 *     tags: [Zoom]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Zoom webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid webhook payload
 */
router.post("/webhook", handleZoomWebhook);

export default router;
