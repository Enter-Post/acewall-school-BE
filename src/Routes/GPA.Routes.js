import { getGPAScale, setGPAscale } from "../Contollers/GPA.controller.js";
import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/gpa/setGPAscale:
 *   post:
 *     summary: Set GPA scale for the system
 *     tags: [GPA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scale
 *             properties:
 *               scale:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     minGrade:
 *                       type: string
 *                       description: Minimum grade point
 *                     maxGrade:
 *                       type: string
 *                       description: Maximum grade point
 *                     minScore:
 *                       type: number
 *                       description: Minimum score for this grade
 *                     maxScore:
 *                       type: number
 *                       description: Maximum score for this grade
 *                     gradePoint:
 *                       type: number
 *                       description: GPA point value
 *                     letterGrade:
 *                       type: string
 *                       description: Letter grade (A, B, C, etc.)
 *                 description: GPA scale array
 *               institutionType:
 *                 type: string
 *                 enum: [high_school, college, university]
 *                 description: Institution type for this GPA scale
 *               description:
 *                 type: string
 *                 description: Description of the GPA scale
 *     responses:
 *       201:
 *         description: GPA scale set successfully
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
 *                     description:
 *                       type: string
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
router.post("/setGPAscale", isUser, setGPAscale);

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