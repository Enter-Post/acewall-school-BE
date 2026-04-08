import express from "express";
import {
  createQuarter,
  editQuarter,
  getDatesofQuarter,
  getQuarter,
  getQuartersofSemester,
  getQuartersofSemester_Updated,
  getSemesterQuarter,
} from "../../Contollers/CourseControllers/quarter.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { isEnrolledMiddleware } from "../../middlewares/isEnrolled.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/quarter/create:
 *   post:
 *     summary: Create a new academic quarter
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - semesterId
 *               - courseId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Quarter name (e.g., "Q1", "Fall Quarter")
 *               semesterId:
 *                 type: string
 *                 description: Semester ID this quarter belongs to
 *               courseId:
 *                 type: string
 *                 description: Course ID this quarter belongs to
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Quarter start date (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Quarter end date (YYYY-MM-DD)
 *               description:
 *                 type: string
 *                 description: Quarter description
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether this quarter is currently active
 *     responses:
 *       201:
 *         description: Quarter created successfully
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
 *                     name:
 *                       type: string
 *                     semester:
 *                       $ref: '#/components/schemas/Semester'
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     description:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
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
router.post("/create", createQuarter);

/**
 * @swagger
 * /api/quarter/get:
 *   get:
 *     summary: Get all quarters
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID (optional)
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: string
 *         description: Filter by semester ID (optional)
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
 *         description: Number of quarters per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (optional)
 *     responses:
 *       200:
 *         description: Quarters retrieved
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
 *                     quarters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           semester:
 *                             $ref: '#/components/schemas/Semester'
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           description:
 *                             type: string
 *                           isActive:
 *                             type: boolean
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
 *                         totalQuarters:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/get", getQuarter);

/**
 * @swagger
 * /api/quarter/getquarters:
 *   post:
 *     summary: Get quarters for a semester
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - semesterId
 *             properties:
 *               semesterId:
 *                 type: string
 *                 description: Semester ID
 *               courseId:
 *                 type: string
 *                 description: Course ID (optional)
 *     responses:
 *       200:
 *         description: Quarters retrieved
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
 *                     semester:
 *                       $ref: '#/components/schemas/Semester'
 *                     quarters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/getquarters", getQuartersofSemester);

/**
 * @swagger
 * /api/quarter/get/{courseId}/{semesterId}:
 *   get:
 *     summary: Get quarters for a specific course and semester
 *     tags: [Quarter]
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
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *       - in: query
 *         name: includeDates
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include quarter date ranges
 *     responses:
 *       200:
 *         description: Quarters retrieved
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
 *                     semester:
 *                       $ref: '#/components/schemas/Semester'
 *                     quarters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           isActive:
 *                             type: boolean
 *                           description:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Course or semester not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:courseId/:semesterId", isUser, isEnrolledMiddleware, getSemesterQuarter);

/**
 * @swagger
 * /api/quarter/getforteacher/{courseId}/{semesterId}:
 *   get:
 *     summary: Get quarters for teacher view
 *     tags: [Quarter]
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
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Quarters retrieved for teacher
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
 *                     semester:
 *                       $ref: '#/components/schemas/Semester'
 *                     quarters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           isActive:
 *                             type: boolean
 *                           description:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Course or semester not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getforteacher/:courseId/:semesterId", isUser, getSemesterQuarter);

/**
 * @swagger
 * /api/quarter/get/{semesterId}:
 *   get:
 *     summary: Get quarters by semester ID
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
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
 *         description: Number of quarters per page
 *     responses:
 *       200:
 *         description: Quarters retrieved
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
 *                     semester:
 *                       $ref: '#/components/schemas/Semester'
 *                     quarters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           isActive:
 *                             type: boolean
 *                           description:
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
 *                         totalQuarters:
 *                           type: integer
 *       404:
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:semesterId", isUser, getSemesterQuarter);

/**
 * @swagger
 * /api/quarter/getDatesofQuarter/{quarterId}:
 *   get:
 *     summary: Get date range for a specific quarter
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quarterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quarter ID
 *     responses:
 *       200:
 *         description: Quarter dates retrieved
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
 *                     quarter:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         startDate:
 *                           type: string
 *                           format: date
 *                         endDate:
 *                           type: string
 *                           format: date
 *                         isActive:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Quarter not found
 *       401:
 *         description: Unauthorized
 */
router.get(`/getDatesofQuarter/:quarterId`, getDatesofQuarter);

/**
 * @swagger
 * /api/quarter/editQuarter/{quarterId}:
 *   put:
 *     summary: Update quarter details
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated quarter name
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Updated start date (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Updated end date (YYYY-MM-DD)
 *               description:
 *                 type: string
 *                 description: Updated quarter description
 *               isActive:
 *                 type: boolean
 *                 description: Updated active status
 *     responses:
 *       200:
 *         description: Quarter updated successfully
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
 *                     name:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     description:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Quarter not found
 *       401:
 *         description: Unauthorized
 */
router.put("/editQuarter/:quarterId", editQuarter);

/**
 * @swagger
 * /api/quarter/getquarters_updated:
 *   post:
 *     summary: Get updated quarters for a semester
 *     tags: [Quarter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - semesterId
 *             properties:
 *               semesterId:
 *                 type: string
 *                 description: Semester ID
 *               courseId:
 *                 type: string
 *                 description: Course ID (optional)
 *     responses:
 *       200:
 *         description: Updated quarters retrieved
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
 *                     semester:
 *                       $ref: '#/components/schemas/Semester'
 *                     quarters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           isActive:
 *                             type: boolean
 *                           description:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/getquarters_updated", getQuartersofSemester_Updated);

export default router;
