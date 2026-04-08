import express from "express";
import { sendSchoolcontactmail } from "../Contollers/contact.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/contact/sendSchoolcontactmail:
 *   post:
 *     summary: Send contact email to school
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Contact person's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact person's email address
 *               subject:
 *                 type: string
 *                 description: Contact message subject
 *               message:
 *                 type: string
 *                 description: Contact message content
 *               phone:
 *                 type: string
 *                 description: Contact person's phone number (optional)
 *               department:
 *                 type: string
 *                 enum: [admissions, academics, technical, billing, general]
 *                 description: Department to contact
 *               urgency:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Message urgency level
 *     responses:
 *       200:
 *         description: Contact email sent successfully
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
 *                     referenceId:
 *                       type: string
 *                     estimatedResponseTime:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/sendSchoolcontactmail", sendSchoolcontactmail)

export default router;