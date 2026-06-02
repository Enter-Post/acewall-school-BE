import express from "express";
import {
    updatePassword
} from "../../../Contollers/AdminControllers/SuperAdminControllers/auth.controller.js";
import { isUser } from "../../../middlewares/Auth.Middleware.js";

const router = express.Router();

// Update user password
router.put("/update-password/:id", isUser, updatePassword);

export default router;
