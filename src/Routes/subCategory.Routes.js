import express from "express"
import { createSubCategory, getSubcategory,deleteSubcategory, updateSubCategory, getSubcategoruWithcategory } from "../Contollers/CourseControllers/subCategory.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/subcategory/create:
 *   post:
 *     summary: Create a new subcategory
 *     tags: [Subcategory]
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
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Subcategory name
 *               description:
 *                 type: string
 *                 description: Subcategory description
 *               categoryId:
 *                 type: string
 *                 description: Parent category ID
 *               color:
 *                 type: string
 *                 description: Color code for UI display (optional)
 *               icon:
 *                 type: string
 *                 description: Icon identifier (optional)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether this subcategory is active
 *     responses:
 *       201:
 *         description: Subcategory created successfully
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
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *                     color:
 *                       type: string
 *                     icon:
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
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.post("/create", createSubCategory);

/**
 * @swagger
 * /api/subcategory/get:
 *   get:
 *     summary: Get all subcategories
 *     tags: [Subcategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID (optional)
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
 *         description: Number of subcategories per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search subcategories by name (optional)
 *     responses:
 *       200:
 *         description: Subcategories retrieved
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
 *                     subcategories:
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
 *                           category:
 *                             $ref: '#/components/schemas/Category'
 *                           color:
 *                             type: string
 *                           icon:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           courseCount:
 *                             type: integer
 *                             description: Number of courses in this subcategory
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
 *                         totalSubcategories:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/get", getSubcategory);

/**
 * @swagger
 * /api/subcategory/delete/{id}:
 *   delete:
 *     summary: Delete a subcategory
 *     tags: [Subcategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID to delete
 *     responses:
 *       200:
 *         description: Subcategory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Subcategory not found
 *       403:
 *         description: Not authorized to delete this subcategory
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:id", deleteSubcategory); 

/**
 * @swagger
 * /api/subcategory/subcategory/{id}:
 *   put:
 *     summary: Update a subcategory
 *     tags: [Subcategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated subcategory name
 *               description:
 *                 type: string
 *                 description: Updated subcategory description
 *               categoryId:
 *                 type: string
 *                 description: Updated parent category ID
 *               color:
 *                 type: string
 *                 description: Updated color code
 *               icon:
 *                 type: string
 *                 description: Updated icon identifier
 *               isActive:
 *                 type: boolean
 *                 description: Updated active status
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
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
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *                     color:
 *                       type: string
 *                     icon:
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
 *         description: Subcategory not found
 *       401:
 *         description: Unauthorized
 */
router.put("/subcategory/:id", updateSubCategory);

/**
 * @swagger
 * /api/subcategory/getSubcategoryWithCategory/{id}:
 *   get:
 *     summary: Get subcategories for a specific category
 *     tags: [Subcategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *         description: Number of subcategories per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (optional)
 *     responses:
 *       200:
 *         description: Subcategories for category retrieved
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
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *                     subcategories:
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
 *                           color:
 *                             type: string
 *                           icon:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           courseCount:
 *                             type: integer
 *                             description: Number of courses in this subcategory
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
 *                         totalSubcategories:
 *                           type: integer
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getSubcategoryWithCategory/:id", getSubcategoruWithcategory);

export default router;