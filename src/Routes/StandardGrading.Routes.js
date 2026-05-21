import express from 'express';
import { getStandardGradingScale } from '../Contollers/StandardGrading.controller.js';
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

export default router;