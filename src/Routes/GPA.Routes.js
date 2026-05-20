import { getGPAScale } from "../Contollers/GPA.controller.js";
import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/gpa/get:
 *   get:
 *     summary: Get current GPA scale
 *     tags: [GPA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: institutionType
 *         schema:
 *           type: string
 *           enum: [high_school, college, university]
 *         description: Filter by institution type (optional)
 *     responses:
 *       200:
 *         description: GPA scale retrieved
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
 *                     _id:
 *                       type: string
 *                     scale:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           minGrade:
 *                             type: string
 *                           maxGrade:
 *                             type: string
 *                           minScore:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           gradePoint:
 *                             type: number
 *                           letterGrade:
 *                             type: string
 *                     institutionType:
 *                       type: string
 *                       enum: [high_school, college, university]
 *                     description:
 *                       type: string
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
router.get("/get", isUser, getGPAScale);

export default router;