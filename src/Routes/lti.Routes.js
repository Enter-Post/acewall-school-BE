import express from "express"
import { createPlatform, ltiLaunch, ltiLogin } from "../Contollers/lti.controller.js"
import { isUser } from "../middlewares/Auth.Middleware.js"
import LTIPlatform from "../Models/LTIPlatfrom.model.js"

const router = express.Router()

router.get("/login", ltiLogin)
router.post("/launch", ltiLaunch)
router.post("/create-platform", createPlatform)
router.get("/list-platforms", async (req, res) => {
  try {
    const platforms = await LTIPlatform.find({});
    res.json({ platforms, count: platforms.length });
  } catch (err) {
    console.error("List Platforms Error:", err);
    res.status(500).json({ error: "Failed to list platforms" });
  }
});
export default router