import express from "express";
import {
  createAssessmentCategory,
  deleteAssessmentCategory,
  editWeight,
  getAssessmentCategories,
} from "../Contollers/assessment-category.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { validateCategoryWeight } from "../middlewares/validCategoryWeight.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/assessment-category/{courseId}:
 *   post:
 *     summary: Create a new assessment category for a course
 *     tags: [Assessment Category]
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
 *               - name
 *               - weight
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (e.g., "Quizzes", "Exams", "Assignments")
 *               description:
 *                 type: string
 *                 description: Category description
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Weight percentage for this category (0-100)
 *               color:
 *                 type: string
 *                 description: Color code for UI display (optional)
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default category
 *     responses:
 *       201:
 *         description: Assessment category created successfully
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
 *                     description:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     color:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data or total weight exceeds 100%
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:courseId",
  isUser,
  validateCategoryWeight,
  createAssessmentCategory
);

/**
 * @swagger
 * /api/assessment-category/{courseId}:
 *   get:
 *     summary: Get assessment categories for a course
 *     tags: [Assessment Category]
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
 *         name: includeStats
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include usage statistics
 *     responses:
 *       200:
 *         description: Assessment categories retrieved
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           weight:
 *                             type: number
 *                           color:
 *                             type: string
 *                           isDefault:
 *                             type: boolean
 *                           assessmentCount:
 *                             type: integer
 *                             description: Number of assessments in this category
 *                           totalWeight:
 *                             type: number
 *                             description: Total weight of assessments in this category
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     totalWeight:
 *                       type: number
 *                       description: Total weight of all categories
 *                     defaultCategory:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         weight:
 *                           type: number
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:courseId", isUser, getAssessmentCategories);

/**
 * @swagger
 * /api/assessment-category/{courseId}/{categoryId}:
 *   put:
 *     summary: Update assessment category weight
 *     tags: [Assessment Category]
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
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weight
 *             properties:
 *               weight:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: New weight percentage (0-100)
 *               name:
 *                 type: string
 *                 description: Updated category name (optional)
 *               description:
 *                 type: string
 *                 description: Updated category description (optional)
 *               color:
 *                 type: string
 *                 description: Updated color code (optional)
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default category (optional)
 *     responses:
 *       200:
 *         description: Assessment category updated successfully
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
 *                     description:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     color:
 *                       type: string
 *                     isDefault:
 *                       type: boolean
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data or total weight exceeds 100%
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course or category not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:courseId/:categoryId",
  isUser,
  validateCategoryWeight,
  editWeight
);

/**
 * @swagger
 * /api/assessment-category/{categoryId}:
 *   delete:
 *     summary: Delete an assessment category
 *     tags: [Assessment Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID to delete
 *     responses:
 *       200:
 *         description: Assessment category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Category not found
 *       403:
 *         description: Not authorized to delete this category
 *       401:
 *         description: Unauthorized
 */
router.delete("/:categoryId", isUser, deleteAssessmentCategory);

export default router;
