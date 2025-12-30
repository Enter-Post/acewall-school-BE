import express from "express";
import { getChildrenData } from "../Contollers/auth.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getChildGradebookForParent } from "../Contollers/gradebookUpdated.controller.js";


const router = express.Router();

// GET /api/parent/my-children
router.get("/my-children", isUser, getChildrenData);
router.get("/child-gradebook/:studentId", isUser, getChildGradebookForParent);
export default router;