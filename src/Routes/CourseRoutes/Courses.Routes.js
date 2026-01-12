import express from "express";
import { isUser } from "../../middlewares/Auth.Middleware.js";
import { upload } from "../../lib/multer.config.js";
import {
  createCourseSch,
  deleteCourseSch,
  getAllCoursesSch,
  getCourseDetails,
  getCoursesbySubcategorySch,
  getCoursesByTeacherSch,
  getCoursesforadminofteacher,
  getunPurchasedCourseByIdSch,
  getallcoursesforteacher,
  getDueDate,
  archivedCourse,
  getCourseBasics,
  getBasicCoursesByTeacherId,
  editCourseInfo,
  thumnailChange,
  getunPurchasedCourseByIdStdPrew,
  searchCoursebycode,
  toggleCourseComments,
  toggleGradingSystem,
  getCourseEnrollmentStats,
  getUserCoursesforFilter,
  importFullCourse,
  getFullCourseData,
} from "../../Contollers/CourseControllers/courses.controller.sch.js";
import { getAllCoursesSchupdated, getCoursesByTeacherSch_WEB } from "../../Contollers/UPDATED_API_CONTROLLER/course.controller.web.js";

const router = express.Router();

router.patch("/:courseId/toggle-comments", toggleCourseComments);


router.get('/export-full-course/:courseId', getFullCourseData);
 
 
router.post('/import-full-course', isUser, importFullCourse);

////WEB APIS

///////// router.get("/getindividualcourse", isUser, getCoursesByTeacherSch);
router.get("/getTeacherCourses", isUser, getCoursesByTeacherSch_WEB)
router.get("/getUserCoursesforFilter", isUser, getUserCoursesforFilter);

////PREV APIS
router.put(`/archive/:courseId`, isUser, archivedCourse);
router.get("/all", getAllCoursesSch);
// updated course api route
router.get("/allupdated", getAllCoursesSchupdated);
// XXXXX
router.get("/getindividualcourse", isUser, getCoursesByTeacherSch);
router.get("/getCoursesforadminofteacher", isUser, getCoursesforadminofteacher);

router.get("/basicCoursesByTeacher", isUser, getBasicCoursesByTeacherId); // ✅ MOVE UP
router.post(
  "/create",
  isUser,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "syllabus", maxCount: 1 },
  ]),
  createCourseSch
);
router.get("/all", getAllCoursesSch);
router.get("/getindividualcourse", isUser, getCoursesByTeacherSch);
router.get("/getCoursesforadminofteacher", getCoursesforadminofteacher);

router.get("/getallCoursesforTeacher", isUser, getallcoursesforteacher);

// ❌ KEEP THIS AT THE BOTTOM
router.get("/:subCategoryId", getCoursesbySubcategorySch);

// Other specific routes
router.get("/details/:courseId", isUser, getCourseDetails);
router.get("/get/:id", getunPurchasedCourseByIdSch);
router.get("/getstdprew/:id", getunPurchasedCourseByIdStdPrew);
router.delete("/delete/:courseId", isUser, deleteCourseSch);
router.get(`/getcourseDueDate/:courseId`, isUser, getDueDate);
router.get(`/getCourseBasics/:courseId`, isUser, getCourseBasics);
router.put(
  "/editCourseBasics/:courseId",
  upload.single("syllabus"), // <--- handle syllabus upload
  editCourseInfo
); router.put(`/thumbnail/:courseId`, isUser, upload.single("thumbnail"), thumnailChange);
router.get("/searchCoursebycode/:courseCode", isUser, searchCoursebycode);
router.put("/course/:courseId/toggle-grading", toggleGradingSystem);

router.get('/stats/:courseId', getCourseEnrollmentStats);
export default router;

