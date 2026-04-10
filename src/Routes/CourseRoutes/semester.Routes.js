import express from "express";
import { createSemester, editSemester, getSemester, getSemesterwithQuarter, selectingNewSemesterwithQuarter } from "../../Contollers/CourseControllers/semester.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/semester/create:
 *   post:
 *     summary: Create a new academic semester
 *     tags: [Semester]
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
 *               - year
 *             properties:
 *               name:
 *                 type: string
 *                 description: Semester name (e.g., "Fall 2024", "Spring 2025")
 *               year:
 *                 type: integer
 *                 description: Academic year (e.g., 2024)
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Semester start date (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Semester end date (YYYY-MM-DD)
 *               description:
 *                 type: string
 *                 description: Semester description
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether this semester is currently active
 *     responses:
 *       201:
 *         description: Semester created successfully
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
 *                     year:
 *                       type: integer
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
router.post("/create", createSemester);

/**
 * @swagger
 * /api/semester/get:
 *   get:
 *     summary: Get all semesters
 *     tags: [Semester]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by academic year (optional)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (optional)
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
 *         description: Number of semesters per page
 *     responses:
 *       200:
 *         description: Semesters retrieved
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
 *                     semesters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           year:
 *                             type: integer
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
 *                         totalSemesters:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/get", getSemester);

/**
 * @swagger
 * /api/semester/getSemesterwithQuarter:
 *   get:
 *     summary: Get semesters with their quarters
 *     tags: [Semester]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID (optional)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by academic year (optional)
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
 *         description: Number of semesters per page
 *     responses:
 *       200:
 *         description: Semesters with quarters retrieved
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
 *                     semesters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           year:
 *                             type: integer
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
 *                           quarters:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 startDate:
 *                                   type: string
 *                                   format: date
 *                                 endDate:
 *                                   type: string
 *                                   format: date
 *                                 isActive:
 *                                   type: boolean
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
 *                         totalSemesters:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/getSemesterwithQuarter", getSemesterwithQuarter);

/**
 * @swagger
 * /api/semester/selectingNewSemesterwithQuarter/{courseId}:
 *   post:
 *     summary: Select new semester for a course with quarters
 *     tags: [Semester]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
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
 *                 description: Semester ID to select
 *               quarterId:
 *                 type: string
 *                 description: Quarter ID to activate (optional)
 *     responses:
 *       200:
 *         description: Semester selected successfully
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     selectedSemester:
 *                       $ref: '#/components/schemas/Semester'
 *                     selectedQuarter:
 *                       $ref: '#/components/schemas/Quarter'
 *                     previousSemester:
 *                       $ref: '#/components/schemas/Semester'
 *                     previousQuarter:
 *                       $ref: '#/components/schemas/Quarter'
 *       404:
 *         description: Course, semester, or quarter not found
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post("/selectingNewSemesterwithQuarter/:courseId", selectingNewSemesterwithQuarter);

/**
 * @swagger
 * /api/semester/editSemester/{semesterId}:
 *   put:
 *     summary: Update semester details
 *     tags: [Semester]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semesterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated semester name
 *               year:
 *                 type: integer
 *                 description: Updated academic year
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
 *                 description: Updated semester description
 *               isActive:
 *                 type: boolean
 *                 description: Updated active status
 *     responses:
 *       200:
 *         description: Semester updated successfully
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
 *                     year:
 *                       type: integer
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
 *         description: Semester not found
 *       401:
 *         description: Unauthorized
 */
router.put("/editSemester/:semesterId", isUser, editSemester);

export default router;