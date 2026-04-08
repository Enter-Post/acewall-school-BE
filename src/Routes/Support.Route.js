import express from "express";
import { sendContactMail, sendSupportMail } from "../Contollers/Support.controller.js";
// import { sendSupportMail } from "../contollers/Support.Controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/support/send:
 *   post:
 *     summary: Send support request email
 *     tags: [Support]
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
 *                 description: Sender's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Sender's email address
 *               subject:
 *                 type: string
 *                 description: Support request subject
 *               message:
 *                 type: string
 *                 description: Support request message
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Support request priority
 *               category:
 *                 type: string
 *                 enum: [technical, billing, account, course, other]
 *                 description: Support request category
 *               userId:
 *                 type: string
 *                 description: User ID (if logged in)
 *     responses:
 *       200:
 *         description: Support request sent successfully
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
 *                     ticketId:
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
router.post("/send", sendSupportMail);

/**
 * @swagger
 * /api/support/sendcontactmail:
 *   post:
 *     summary: Send contact form email
 *     tags: [Support]
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
 *               company:
 *                 type: string
 *                 description: Company name (optional)
 *               reason:
 *                 type: string
 *                 enum: [general, partnership, support, feedback, other]
 *                 description: Reason for contact
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
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/sendcontactmail", sendContactMail);

export default router;
