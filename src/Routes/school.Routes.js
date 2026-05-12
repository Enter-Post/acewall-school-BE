/**
 * School Routes
 * Protected by RBAC - district_admin can manage schools in their district
 */

import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";
import {
  requirePermission,
  requireRole,
  requireAdmin,
} from "../middlewares/rbac.middleware.js";
import {
  verifySchoolAccess,
  enforceDistrictCreation,
} from "../middlewares/district.middleware.js";
import {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  syncSchoolExternalId,
  getSchoolsForDropdown,
} from "../Contollers/school.controller.js";
import * as PERMISSIONS from "../modules/rbac/permissions.js";
import { ROLES } from "../modules/rbac/roles.js";

const router = express.Router();

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
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
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               homeAddress:
 *                 type: string
 *               website:
 *                 type: string
 *               districtId:
 *                 type: string
 *                 description: Only super_admin can specify different district
 *               externalIds:
 *                 type: object
 *                 properties:
 *                   clever: { type: string }
 *                   canvas: { type: string }
 *                   oneroster: { type: string }
 *                   lti: { type: string }
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: School created successfully
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: School with email already exists
 */
router.post(
  "/",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_CREATE),
  enforceDistrictCreation,
  createSchool
);

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get all schools (filtered by district for non-super-admins)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of schools
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_READ),
  getSchools
);

/**
 * @swagger
 * /api/schools/dropdown:
 *   get:
 *     summary: Get schools for dropdown (lightweight)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schools with _id and name only
 */
router.get(
  "/dropdown",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_READ),
  getSchoolsForDropdown
);

/**
 * @swagger
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School details
 *       403:
 *         description: Access denied - school not in your district
 *       404:
 *         description: School not found
 */
router.get(
  "/:id",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_READ),
  verifySchoolAccess,
  getSchoolById
);

/**
 * @swagger
 * /api/schools/{id}:
 *   patch:
 *     summary: Update school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               homeAddress:
 *                 type: string
 *               website:
 *                 type: string
 *               externalIds:
 *                 type: object
 *               settings:
 *                 type: object
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: School updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: School not found
 */
router.patch(
  "/:id",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_UPDATE),
  verifySchoolAccess,
  updateSchool
);

/**
 * @swagger
 * /api/schools/{id}:
 *   delete:
 *     summary: Delete school (soft delete)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: School not found
 */
router.delete(
  "/:id",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_DELETE),
  verifySchoolAccess,
  deleteSchool
);

/**
 * @swagger
 * /api/schools/{id}/sync-external:
 *   patch:
 *     summary: Sync school external ID (LTI/Clever/Canvas)
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - externalId
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [clever, canvas, oneroster, lti]
 *               externalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: School synced successfully
 *       400:
 *         description: Invalid provider
 *       403:
 *         description: Access denied
 */
router.patch(
  "/:id/sync-external",
  isUser,
  requirePermission(PERMISSIONS.SCHOOL_MANAGE),
  verifySchoolAccess,
  syncSchoolExternalId
);

export default router;
