// routes/webhook.js
import express from "express";
import Stripe from "stripe";
import User from "../Models/user.model.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * @swagger
 * /api/webhook/stripe/webhook:
 *   post:
 *     summary: Stripe webhook endpoint for payment processing
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       description: Stripe webhook event payload
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Event ID
 *               object:
 *                 type: object
 *                 description: Event object containing payment details
 *               type:
 *                 type: string
 *                 enum: [checkout.session.completed, checkout.session.expired, payment_intent.succeeded, payment_intent.payment_failed]
 *                 description: Event type
 *               created:
 *                 type: integer
 *                 description: Unix timestamp of event creation
 *               livemode:
 *                 type: boolean
 *                 description: Whether this is in live mode
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   description: Confirmation that webhook was received
 *       400:
 *         description: Invalid webhook signature or processing error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Error message
 *     externalDocs:
 *       description: This endpoint receives Stripe webhook events for payment processing. It handles checkout.session.completed events to automatically enroll users in purchased courses.
 */
router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const courseId = session.metadata.courseId;

    // Add course to user
    const user = await User.findById(userId);
    if (!user.purchasedCourse.includes(courseId)) {
      user.purchasedCourse.push(courseId);
      await user.save();
    }
  }

  res.status(200).json({ received: true });
});

export default router;
