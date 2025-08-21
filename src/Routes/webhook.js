// routes/webhook.js
import express from "express";
import Stripe from "stripe";
import User from "../Models/user.model.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

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
