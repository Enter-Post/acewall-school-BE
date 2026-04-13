import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";
import {
  createRating,
  getSingleCourseRating,
  isRatedbyUser,
} from "../Contollers/rating.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/rating/create/{id}:
 *   post:
 *     summary: Create a rating for a course
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Course rating (1-5 stars)
 *               review:
 *                 type: string
 *                 description: Optional review text
 *               anonymous:
 *                 type: boolean
 *                 default: false
 *                 description: Submit rating anonymously
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       enum: [content, instructor, difficulty, organization]
 *                       description: Rating category
 *                     score:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 5
 *                       description: Score for this category
 *                 description: Detailed category ratings
 *     responses:
 *       201:
 *         description: Rating created successfully
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     rating:
 *                       type: number
 *                     review:
 *                       type: string
 *                     anonymous:
 *                       type: boolean
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           score:
 *                             type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data or already rated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.post("/create/:id", isUser, createRating);

/**
 * @swagger
 * /api/rating/course/{id}:
 *   get:
 *     summary: Get ratings and average rating for a course
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
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
 *         description: Number of ratings per page
 *     responses:
 *       200:
 *         description: Course ratings retrieved
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
 *                     averageRating:
 *                       type: number
 *                     totalRatings:
 *                       type: integer
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         fiveStars:
 *                           type: integer
 *                         fourStars:
 *                           type: integer
 *                         threeStars:
 *                           type: integer
 *                         twoStars:
 *                           type: integer
 *                         oneStar:
 *                           type: integer
 *                     categoryAverages:
 *                       type: object
 *                       properties:
 *                         content:
 *                           type: number
 *                         instructor:
 *                           type: number
 *                         difficulty:
 *                           type: number
 *                         organization:
 *                           type: number
 *                     ratings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           user:
 *                             $ref: '#/components/schemas/User'
 *                           rating:
 *                             type: number
 *                           review:
 *                             type: string
 *                           anonymous:
 *                             type: boolean
 *                           categories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 category:
 *                                   type: string
 *                                   score:
 *                                     type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalRatings:
 *                           type: integer
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/course/:id", isUser, getSingleCourseRating);

/**
 * @swagger
 * /api/rating/isRated/{id}:
 *   get:
 *     summary: Check if current user has rated a course
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to check
 *     responses:
 *       200:
 *         description: Rating status retrieved
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
 *                     hasRated:
 *                       type: boolean
 *                     userRating:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         rating:
 *                           type: number
 *                         review:
 *                           type: string
 *                         anonymous:
 *                           type: boolean
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                                 score:
 *                                   type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/isRated/:id", isUser, isRatedbyUser);

export default router;
