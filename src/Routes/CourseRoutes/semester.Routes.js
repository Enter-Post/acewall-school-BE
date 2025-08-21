import express from "express";
import { createSemester, editSemester, getSemester, getSemesterwithQuarter, selectingNewSemesterwithQuarter } from "../../Contollers/CourseControllers/semester.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";
const router = express.Router();

router.post("/create", createSemester);
router.get("/get", getSemester);
router.get("/getSemesterwithQuarter", getSemesterwithQuarter);
router.post("/selectingNewSemesterwithQuarter/:courseId", selectingNewSemesterwithQuarter)

router.put("/editSemester/:semesterId", isUser, editSemester);

export default router;