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
  getCoursesWithMeetings,
  getStudentofCourse,
} from "../../Contollers/CourseControllers/courses.controller.sch.js";

import { getPacingChartByCourse } from "../../Contollers/PacingChart.controller.js";
import {
  getAllCoursesSchupdated,
  getCoursesByTeacherSch_WEB,
} from "../../Contollers/UPDATED_API_CONTROLLER/course.controller.web.js";
import { acceptShare, getSharedWithMe, rejectShare, shareCourse } from "../../Contollers/CourseControllers/courseShare.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/course/{courseId}/toggle-comments:
 *   patch:
 *     summary: Toggle comments for a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Comments toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:courseId/toggle-comments", toggleCourseComments);

/**
 * @swagger
 * /api/course/export-full-course/{courseId}:
 *   get:
 *     summary: Export full course data
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to export
 *     responses:
 *       200:
 *         description: Course data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Complete course data
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/export-full-course/:courseId", getFullCourseData);

/**
 * @swagger
 * /api/course/import-full-course:
 *   post:
 *     summary: Import full course data
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseData
 *             properties:
 *               courseData:
 *                 type: object
 *                 description: Complete course data to import
 *     responses:
 *       201:
 *         description: Course imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid course data
 *       401:
 *         description: Unauthorized
 */
router.post("/import-full-course", isUser, importFullCourse);

// Course Sharing Routes
/**
 * @swagger
 * /api/course/share:
 *   post:
 *     summary: Share a course with other users
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - emails
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID to share
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *                 description: List of email addresses to share with
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [view, edit, admin]
 *                 description: Permissions to grant
 *     responses:
 *       200:
 *         description: Course shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/share", isUser, shareCourse);

/**
 * @swagger
 * /api/course/shared-with-me:
 *   get:
 *     summary: Get courses shared with current user
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shared courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       course:
 *                         $ref: '#/components/schemas/Course'
 *                       sharedBy:
 *                         $ref: '#/components/schemas/User'
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/shared-with-me", isUser, getSharedWithMe);

/**
 * @swagger
 * /api/course/accept-share/{shareId}:
 *   post:
 *     summary: Accept a course share invitation
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *         description: Share invitation ID
 *     responses:
 *       200:
 *         description: Share accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Share invitation not found
 *       401:
 *         description: Unauthorized
 */
router.post("/accept-share/:shareId", isUser, acceptShare);

/**
 * @swagger
 * /api/course/reject-share/{shareId}:
 *   post:
 *     summary: Reject a course share invitation
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *         description: Share invitation ID
 *     responses:
 *       200:
 *         description: Share rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Share invitation not found
 *       401:
 *         description: Unauthorized
 */
router.post("/reject-share/:shareId", isUser, rejectShare);

////WEB APIS

///////// router.get("/getindividualcourse", isUser, getCoursesByTeacherSch);
/**
 * @swagger
 * /api/course/getTeacherCourses:
 *   get:
 *     summary: Get courses for current teacher (Web API)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teacher's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 */
router.get("/getTeacherCourses", isUser, getCoursesByTeacherSch_WEB);

/**
 * @swagger
 * /api/course/getUserCoursesforFilter:
 *   get:
 *     summary: Get courses for user filtering
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses for filtering
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       courseCode:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/getUserCoursesforFilter", isUser, getUserCoursesforFilter);

////PREV APIS
/**
 * @swagger
 * /api/course/archive/{courseId}:
 *   put:
 *     summary: Archive a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to archive
 *     responses:
 *       200:
 *         description: Course archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.put(`/archive/:courseId`, isUser, archivedCourse);

/**
 * @swagger
 * /api/course/all:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       500:
 *         description: Server error
 */
router.get("/all", getAllCoursesSch);

/**
 * @swagger
 * /api/course/allupdated:
 *   get:
 *     summary: Get all courses with updated data
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all updated courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       500:
 *         description: Server error
 */
router.get("/allupdated", getAllCoursesSchupdated);
// XXXXX
router.get("/getindividualcourse", isUser, getCoursesByTeacherSch);
router.get("/getCoursesforadminofteacher", isUser, getCoursesforadminofteacher);

router.get("/basicCoursesByTeacher", isUser, getBasicCoursesByTeacherId); // ✅ MOVE UP
/**
 * @swagger
 * /api/course/create:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - subcategory
 *             properties:
 *               title:
 *                 type: string
 *                 description: Course title
 *               description:
 *                 type: string
 *                 description: Course description
 *               category:
 *                 type: string
 *                 description: Category ID
 *               subcategory:
 *                 type: string
 *                 description: Subcategory ID
 *               courseCode:
 *                 type: string
 *                 description: Unique course code
 *               price:
 *                 type: number
 *                 description: Course price
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Course thumbnail image
 *               syllabus:
 *                 type: string
 *                 format: binary
 *                 description: Course syllabus file
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/create",
  isUser,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "syllabus", maxCount: 1 },
  ]),
  createCourseSch,
);
router.get("/all", getAllCoursesSch);
router.get("/getindividualcourse", isUser, getCoursesByTeacherSch);
router.get("/getCoursesforadminofteacher", getCoursesforadminofteacher);

router.get("/getallCoursesforTeacher", isUser, getallcoursesforteacher);
router.get("/with-meetings", isUser, getCoursesWithMeetings);

// ❌ KEEP THIS AT THE BOTTOM
router.get("/:subCategoryId", getCoursesbySubcategorySch);

// Other specific routes
/**
 * @swagger
 * /api/course/details/{courseId}:
 *   get:
 *     summary: Get detailed course information
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.get("/details/:courseId", isUser, getCourseDetails);

/**
 * @swagger
 * /api/course/get/{id}:
 *   get:
 *     summary: Get unpurchased course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/get/:id", getunPurchasedCourseByIdSch);

/**
 * @swagger
 * /api/course/getstdprew/{id}:
 *   get:
 *     summary: Get unpurchased course for student preview
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course preview retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get("/getstdprew/:id", getunPurchasedCourseByIdStdPrew);

/**
 * @swagger
 * /api/course/delete/{courseId}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to delete
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:courseId", isUser, deleteCourseSch);
router.get(`/getcourseDueDate/:courseId`, isUser, getDueDate);
router.get(`/getCourseBasics/:courseId`, isUser, getCourseBasics);
router.put(
  "/editCourseBasics/:courseId",
  upload.single("syllabus"), // <--- handle syllabus upload
  editCourseInfo,
);
router.put(
  `/thumbnail/:courseId`,
  isUser,
  upload.single("thumbnail"),
  thumnailChange,
);
router.get("/searchCoursebycode/:courseCode", isUser, searchCoursebycode);
router.put("/course/:courseId/toggle-grading", toggleGradingSystem);

router.get("/stats/:courseId", getCourseEnrollmentStats);

router.get("/:courseId/pacing-chart", isUser, getPacingChartByCourse);
router.get("/getStudentofCourse/:courseId", isUser, getStudentofCourse)

export default router;
