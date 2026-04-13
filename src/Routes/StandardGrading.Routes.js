import express from 'express';
import { getStandardGradingScale, SetStandardGradingScale } from '../Contollers/StandardGrading.controller.js';
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/standard-grading/get:
 *   get:
 *     summary: Get standard grading scale for the institution
 *     tags: [Standard Grading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: institutionType
 *         schema:
 *           type: string
 *           enum: [elementary, middle_school, high_school, university]
 *         description: Filter by institution type (optional)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject (optional)
 *     responses:
 *       200:
 *         description: Standard grading scale retrieved
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
 *                     institutionType:
 *                       type: string
 *                       enum: [elementary, middle_school, high_school, university]
 *                     gradingScale:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           letterGrade:
 *                             type: string
 *                           minPercentage:
 *                             type: number
 *                           maxPercentage:
 *                             type: number
 *                           description:
 *                             type: string
 *                           gpaPoints:
 *                             type: number
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/get", isUser, getStandardGradingScale);

/**
 * @swagger
 * /api/standard-grading/set:
 *   post:
 *     summary: Set standard grading scale for the institution
 *     tags: [Standard Grading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - institutionType
 *               - gradingScale
 *             properties:
 *               institutionType:
 *                 type: string
 *                 enum: [elementary, middle_school, high_school, university]
 *                 description: Institution type
 *               gradingScale:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     letterGrade:
 *                       type: string
 *                       description: Letter grade (A, B, C, etc.)
 *                     minPercentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Minimum percentage for this grade
 *                     maxPercentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Maximum percentage for this grade
 *                     description:
 *                       type: string
 *                       description: Description of the grade's meaning
 *                     gpaPoints:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 4
 *                       description: GPA points for this grade
 *                 description: Array of grade definitions
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to activate this grading scale
 *     responses:
 *       201:
 *         description: Standard grading scale set successfully
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
 *                     institutionType:
 *                       type: string
 *                       enum: [elementary, middle_school, high_school, university]
 *                     gradingScale:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           letterGrade:
 *                             type: string
 *                           minPercentage:
 *                             type: number
 *                           maxPercentage:
 *                             type: number
 *                           description:
 *                             type: string
 *                           gpaPoints:
 *                             type: number
 *                     isActive:
 *                       type: boolean
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
router.post("/set", isUser, SetStandardGradingScale);

export default router;