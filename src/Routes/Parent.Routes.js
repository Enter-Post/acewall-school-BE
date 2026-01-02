import express from "express";
import { getChildrenData } from "../Contollers/auth.controller.js";
import { isUser } from "../middlewares/Auth.Middleware.js";
import { getChildGradebookForParent } from "../Contollers/gradebookUpdated.controller.js";
import { getChildEnrolledCourses, getParentChildCourseDetails } from "../Contollers/enrollment.controller.js";
import { getAnnouncementsForParent } from "../Contollers/announcement.controller.js";
import { getAllAssessmentForParent } from "../Contollers/Assessment.controller.js";
import { getAssessmentSubmissionForParent } from "../Contollers/Submission.controller.js";
import { sendSupportMail } from "../Contollers/Support.controller.js";



const router = express.Router();

// GET /api/parent/my-children
router.get("/my-children", isUser, getChildrenData);
router.get("/child-gradebook/:studentId", isUser, getChildGradebookForParent);
router.get("/child-courses/:studentId", isUser, getChildEnrolledCourses);
router.get(
  "/child-course-details/:studentId/:enrollmentId", 
  isUser, 
  getParentChildCourseDetails
);


router.get("/get-child-announcements/:studentId", isUser, getAnnouncementsForParent);
router.get("/get-child-assessments/:studentId", isUser, getAllAssessmentForParent);
router.get("/submission-detail/:studentId/:assessmentId", isUser, getAssessmentSubmissionForParent);
router.post("/send", sendSupportMail);

export default router;