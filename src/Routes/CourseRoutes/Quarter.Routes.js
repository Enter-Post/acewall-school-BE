import express from "express";
import {
  createQuarter,
  editQuarter,
  getDatesofQuarter,
  getQuarter,
  getQuartersofSemester,
  getQuartersofSemester_Updated,
  getSemesterQuarter,
} from "../../Contollers/CourseControllers/quarter.controller.js";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { isEnrolledMiddleware } from "../../middlewares/isEnrolled.middleware.js";

const router = express.Router();

router.post("/create", createQuarter);
router.get("/get", getQuarter);
router.post("/getquarters", getQuartersofSemester);
router.get("/get/:courseId/:semesterId", isUser, isEnrolledMiddleware, getSemesterQuarter);
router.get("/get/:semesterId", isUser, getSemesterQuarter);
router.get(`/getDatesofQuarter/:quarterId`, getDatesofQuarter);

router.put("/editQuarter/:quarterId", editQuarter);
// router.post("/getquarters", getQuartersofSemester);
router.post("/getquarters_updated", getQuartersofSemester_Updated);

export default router;
