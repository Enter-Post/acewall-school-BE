import express from "express";
import { isUser } from "../middlewares/Auth.Middleware.js";
import {
    getAllDistricts,
    getDistrictById,
    createDistrict,
    updateDistrict,
    deleteDistrict,
    getSchoolsByDistrict,
    getSuperAdminDashboardStats,
} from "../Contollers/SuperAdminControllers/district.controller.js";

const router = express.Router();

router.get("/", isUser, getAllDistricts);
router.get("/dashboard/stats", isUser, getSuperAdminDashboardStats);
router.post("/", isUser, createDistrict);
router.get("/:id", isUser, getDistrictById);
router.get("/:id/schools", isUser, getSchoolsByDistrict);
router.put("/:id", isUser, updateDistrict);
router.delete("/:id", isUser, deleteDistrict);

export default router;