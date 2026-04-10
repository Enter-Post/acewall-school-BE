import express from "express";
import { getPurchasedCourses, purchaseCourse } from "../Contollers/purchase.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/purchase/courses/{id}:
 *   post:
 *     summary: Purchase a course
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to purchase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, paypal, stripe, bank_transfer]
 *                 description: Payment method
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                 description: Billing address for payment
 *               couponCode:
 *                 type: string
 *                 description: Optional discount coupon code
 *               installmentPlan:
 *                 type: string
 *                 enum: [full, monthly_3, monthly_6, monthly_12]
 *                 default: full
 *                 description: Payment installment plan
 *     responses:
 *       201:
 *         description: Course purchased successfully
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
 *                     purchaseId:
 *                       type: string
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     payment:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         method:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [pending, completed, failed]
 *                         transactionId:
 *                           type: string
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 *                     purchasedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data or payment failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.post("/courses/:id", isUser, purchaseCourse);

/**
 * @swagger
 * /api/purchase/courses:
 *   get:
 *     summary: Get purchased courses for current user
 *     tags: [Purchase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of courses per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, expired, all]
 *           default: all
 *         description: Filter by purchase status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [purchase_date, title, price]
 *           default: purchase_date
 *         description: Sort courses by
 *     responses:
 *       200:
 *         description: Purchased courses retrieved
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           purchase:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               amount:
 *                                 type: number
 *                               currency:
 *                                 type: string
 *                               method:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               purchasedAt:
 *                                 type: string
 *                                 format: date-time
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           enrollment:
 *                             $ref: '#/components/schemas/Enrollment'
 *                           progress:
 *                             type: object
 *                             properties:
 *                               completionPercentage:
 *                                 type: number
 *                               lastAccessed:
 *                                 type: string
 *                                 format: date-time
 *                               timeSpent:
 *                                 type: integer
 *                                 description: Time spent in minutes
 *                           certificate:
 *                             type: object
 *                             properties:
 *                               issued:
 *                                 type: boolean
 *                               issuedAt:
 *                                 type: string
 *                                 format: date-time
 *                               downloadUrl:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalCourses:
 *                           type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPurchased:
 *                           type: integer
 *                         totalSpent:
 *                           type: number
 *                         averageCoursePrice:
 *                           type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/courses", isUser, getPurchasedCourses);

export default router;