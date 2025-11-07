import mongoose from "mongoose";
import { uploadToCloudinary } from "../../lib/cloudinary-course.config.js";
import CourseSch from "../../Models/courses.model.sch.js";
import User from "../../Models/user.model.js";
import Enrollment from "../../Models/Enrollement.model.js";
import Chapter from "../../Models/chapter.model.sch.js";
import Lesson from "../../Models/lesson.model.sch.js";
import Assessment from "../../Models/Assessment.model.js";
import AssessmentCategory from "../../Models/assessment-category.js";
import Announcement from "../../Models/Annoucement.model.js";
import Comment from "../../Models/comment.model.js";
import { log } from "console";

export const createCourseSch = async (req, res) => {
  const createdby = req.user._id;

  const {
    courseTitle,
    category,
    subcategory,
    language,
    courseDescription,
    teachingPoints,
    requirements,
    published,
    semester,
    quarter,
  } = req.body;

  const files = req.files; // multiple files: thumbnail and syllabus

  try {
    let thumbnail = { url: "", altText: "" };
    let syllabusFile = { url: "", filename: "" };

    // Upload thumbnail if exists
    if (files?.thumbnail?.[0]) {
      const thumb = files.thumbnail[0];
      const result = await uploadToCloudinary(thumb.buffer, "course_thumbnails");
      thumbnail.url = result.secure_url;
      thumbnail.altText = thumb.originalname;
    }

    // Upload syllabus if exists
    if (files?.syllabus?.[0]) {
      const syllabus = files.syllabus[0];
      const result = await uploadToCloudinary(syllabus.buffer, "course_syllabi"); // use a separate folder
      syllabusFile.url = result.secure_url;
      syllabusFile.filename = syllabus.originalname;
    }

    const parsedTeachingPoints = JSON.parse(teachingPoints);
    const parsedRequirements = JSON.parse(requirements);
    const parsedSemester = JSON.parse(semester);
    const parsedQuarter = JSON.parse(quarter);

    const course = await CourseSch.create({
      courseTitle,
      category,
      subcategory,
      thumbnail,
      syllabus: syllabusFile, // added syllabus field
      language,
      courseDescription,
      teachingPoints: parsedTeachingPoints,
      requirements: parsedRequirements,
      createdby,
      published,
      semester: parsedSemester,
      quarter: parsedQuarter,
    });

    await Enrollment.create({ student: createdby, course: course._id });

    res.status(201).json({ course, message: "Course created successfully" });
  } catch (error) {
    console.log("Error in createCourseSch:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getAllCoursesSch = async (req, res) => {
  try {
    const courses = await CourseSch.find({})
      .sort({ createdAt: -1 })
      .populate(
        "createdby",
        "firstName middleName lastName Bio email profileImg"
      ) // only include necessary fields
      .populate("category", "name") // populate category name only
      .populate("subcategory", "name"); // if you want to include subcategory too

    if (!courses || courses.length === 0) {
      return res.status(200).json({ courses: [], message: "No courses found" });
    }

    res
      .status(200)
      .json({ courses, message: "All courses fetched successfully" });
  } catch (error) {
    console.error("Error fetching all courses:", error);
    res.status(500).json({ error: error.message });
  }
};





export const getCoursesbySubcategorySch = async (req, res) => {
  const { search } = req.query;
  const { subCategoryId } = req.params;

  try {
    const query = {
      subcategory: subCategoryId,
      published: true,
    };

    if (search) {
      query.courseTitle = { $regex: search, $options: "i" }; // case-insensitive regex match
    }

    const courseBysubCategory = await CourseSch.find(query, {
      courseTitle: 1,
      thumbnail: 1,
      category: 1,
      subcategory: 1,
      createdby: 1,
      language: 1,
    })
      .sort({ createdAt: -1 })
      .populate("createdby", "firstName lastName Bio profileImg _id")
      .populate("category", "title")
      .populate("subcategory", "title");

    if (!courseBysubCategory || courseBysubCategory.length === 0) {
      return res.status(200).json({ courses: [], message: "No courses found" });
    }

    res.status(200).json({
      courses: courseBysubCategory,
      message: "Courses fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getunPurchasedCourseByIdSch = async (req, res) => {
  try {
    const courseId = req.params.id;

    const courseData = await CourseSch.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $lookup: {
          from: "chapters",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$course", "$$courseId"] },
              },
            },
            {
              $lookup: {
                from: "lessons",
                let: { chapterId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$chapter", "$$chapterId"] },
                    },
                  },
                  {
                    $project: {
                      title: 1,
                      description: 1,
                      chapter: 1,
                    },
                  },
                ],
                as: "lessons",
              },
            },
            {
              $project: {
                title: 1,
                description: 1,
                lessons: 1,
              },
            },
          ],
          as: "chapters",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdby",
          foreignField: "_id",
          as: "createdby",
        },
      },
      { $unwind: { path: "$createdby", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          courseTitle: 1,
          thumbnail: 1,
          syllabus: 1,

          category: 1,
          subcategory: 1,
          createdby: {
            _id: "$createdby._id",
            firstName: 1,
            middleName: 1,
            lastName: 1,
            Bio: 1,
            profileImg: 1,
          },
          language: 1,
          courseDescription: 1,
          teachingPoints: 1,
          requirements: 1,
          chapters: 1,
        },
      },
    ]);

    if (!courseData || courseData.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Log the createdby info here
    console.log("Created by:", courseData[0].createdby);

    res
      .status(200)
      .json({ course: courseData[0], message: "Course fetched successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


export const getunPurchasedCourseByIdStdPrew = async (req, res) => {
  try {
    const courseId = req.params.id;

    const courseData = await CourseSch.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(courseId) },
      },
      {
        $lookup: {
          from: "chapters",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$course", "$$courseId"] },
              },
            },
            {
              $lookup: {
                from: "lessons",
                let: { chapterId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$chapter", "$$chapterId"] },
                    },
                  },
                  {
                    $project: {
                      title: 1,
                      description: 1,
                      chapter: 1,
                    },
                  },
                ],
                as: "lessons",
              },
            },
            {
              $project: {
                title: 1,
                description: 1,
                lessons: 1,
              },
            },
          ],
          as: "chapters",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdby",
          foreignField: "_id",
          as: "createdby",
        },
      },
      { $unwind: { path: "$createdby", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "semesters",
          localField: "semester",
          foreignField: "_id",
          as: "semester",
          pipeline: [
            {
              $match: { isArchived: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "quarters",
          localField: "quarter",
          foreignField: "_id",
          as: "quarter",
          pipeline: [
            {
              $match: { isArchived: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "assessments",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course", "$$courseId"] },
                    { $eq: ["$type", "final-assessment"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
              },
            },
          ],
          as: "finalAssessments",
        },
      },
      {
        $project: {
          courseTitle: 1,
          courseDescription: 1,
          language: 1,
          thumbnail: 1,
          syllabus: 1,
          createdAt: 1,
          updatedAt: 1,
          teachingPoints: 1,
          semester: 1,
          quarter: 1,
          requirements: 1,
          finalAssessments: 1,

          createdby: {
            _id: "$createdby._id",
            firstName: "$createdby.firstName",
            middleName: "$createdby.middleName",
            lastName: "$createdby.lastName",
            profileImg: "$createdby.profileImg",
            Bio: "$createdby.Bio",
          },
          category: {
            _id: "$category._id",
            title: "$category.title",
          },
          subcategory: {
            _id: "$subcategory._id",
            title: "$subcategory.title",
          },
          chapters: 1,
        },
      },
    ]);

    if (!courseData || courseData.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({
      course: courseData[0],
      message: "Course fetched successfully",
    });
  } catch (error) {
    console.error("Error in getunPurchasedCourseByIdSch:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getCourseDetails = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await CourseSch.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(courseId) },
      },
      // Sort courses by creation date, latest first (assuming `createdAt` is the field for creation date)
      {
        $sort: { createdAt: -1 }, // Use -1 for descending order
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [
            {
              $project: {
                _id: 1,
                title: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
          pipeline: [
            {
              $project: {
                _id: 1,
                title: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$subcategory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "semesters",
          localField: "semester",
          foreignField: "_id",
          as: "semester",
          pipeline: [
            {
              $match: { isArchived: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "quarters",
          localField: "quarter",
          foreignField: "_id",
          as: "quarter",
          pipeline: [
            {
              $match: { isArchived: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "assessments",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course", "$$courseId"] },
                    { $eq: ["$type", "Course-assessment"] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "assessmentcategories",
                localField: "category",
                foreignField: "_id",
                as: "category",
              },
            },
            {
              $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "CourseAssessments",
        },
      },
      {
        $lookup: {
          from: "enrollments",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$course", "$$courseId"],
                },
              },
            },
          ],
          as: "enrollments",
        },
      },
    ]);

    if (!course || course.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: "Course fetched successfully",
      course: course[0],
    });
  } catch (error) {
    console.error("error in getCourseHierarchy", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const deleteCourseSch = async (req, res) => {
  const { courseId } = req.params;

  try {
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // Delete the course
    const deletedCourse = await CourseSch.findByIdAndDelete(courseObjectId);
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Delete all comments related to the course
    await Comment.deleteMany({ course: courseObjectId });

    // Delete related chapters
    const chapters = await Chapter.find({ course: courseObjectId });
    const chapterIds = chapters.map((ch) => ch._id);

    // Delete related lessons
    const lessons = await Lesson.find({ chapter: { $in: chapterIds } });
    const lessonIds = lessons.map((ls) => ls._id);

    // Delete all related chapters and lessons
    await Chapter.deleteMany({ _id: { $in: chapterIds } });
    await Lesson.deleteMany({ _id: { $in: lessonIds } });

    // Delete assessments related to the course, chapters, and lessons
    await Assessment.deleteMany({
      $or: [
        { course: courseObjectId, type: "final-assessment" },
        { chapter: { $in: chapterIds }, type: "chapter-assessment" },
        { lesson: { $in: lessonIds }, type: "lesson-assessment" },
      ],
    });

    // Delete announcements related to the course
    await Announcement.deleteMany({ course: courseObjectId });

    // Delete assessment categories related to the course
    await AssessmentCategory.deleteMany({
      course: courseObjectId,
    });

    // Delete enrollments related to the course
    await Enrollment.deleteMany({ course: courseObjectId });

    res.status(200).json({
      message:
        "Course and all related data, including comments, deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course and related data:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getCoursesByTeacherSch = async (req, res) => {
  const teacherId = req.user._id;
  const search = req.query.search?.trim();

  try {
    // Construct filter based on teacherId and search query
    const query = {
      createdby: teacherId,
    };

    if (search) {
      query["courseTitle"] = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Find courses based on teacherId and optional search
    const courses = await CourseSch.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "createdby",
        select: "firstName middleName lastName profileImg", // Select relevant fields for teacher
      })
      .populate({
        path: "category",
        select: "title", // Select relevant fields for category
      });

    if (!courses || courses.length === 0) {
      return res
        .status(200)
        .json({ courses: [], message: "No courses found for this teacher" });
    }

    res.status(200).json({ courses, message: "Courses fetched successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCoursesforadminofteacher = async (req, res) => {
  const teacherId = req.query.teacherId;
  const { search } = req.query;

  console.log(teacherId, "teacherId");

  try {
    const query = {
      $and: [
        { createdby: teacherId },
        search
          ? { "basics.courseTitle": { $regex: search, $options: "i" } }
          : {},
      ],
    };

    const courses = await CourseSch.find(query)
      .sort({ createdAt: -1 })
      .populate("createdby")
      .populate("category");

    if (!courses || courses.length === 0) {
      return res
        .status(200)
        .json({ courses: [], message: "No courses found for this teacher" });
    }

    res.status(200).json({ courses, message: "Courses fetched successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getallcoursesforteacher = async (req, res) => {
  const teacherId = req.user._id;
  const { courseTitle, page = 1, limit = 8 } = req.query;

  try {
    const matchStage = {
      "courseDetails.createdby": new mongoose.Types.ObjectId(teacherId),
    };

    // Apply course title filter if present
    if (courseTitle) {
      matchStage["courseDetails.courseTitle"] = courseTitle;
    }

    const studentsWithCourses = await Enrollment.aggregate([
      {
        $lookup: {
          from: "coursesches",
          localField: "course",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      { $unwind: "$courseDetails" },
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      { $unwind: "$studentDetails" },
       {
        $match: {
          "studentDetails._id": { $ne: new mongoose.Types.ObjectId(teacherId) },
        },
      },
      {
        $group: {
          _id: "$studentDetails._id",
          firstName: { $first: "$studentDetails.firstName" },
          middleName: { $first: "$studentDetails.middleName" },
          lastName: { $first: "$studentDetails.lastName" },
          Bio: { $first: "$studentDetails.Bio" },
          profileImg: { $first: "$studentDetails.profileImg" },
          gender: { $first: "$studentDetails.gender" },
          email: { $first: "$studentDetails.email" },
          createdAt: { $first: "$studentDetails.createdAt" },
          courses: {
            $push: {
              _id: "$courseDetails._id",
              courseTitle: "$courseDetails.courseTitle",
              description: "$courseDetails.courseDescription",
              thumbnail: "$courseDetails.thumbnail",
              category: "$courseDetails.category",
              subcategory: "$courseDetails.subcategory",
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          data: [
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const students = studentsWithCourses[0].data;
    const totalCount = studentsWithCourses[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      students,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalCount,
      message: "Students fetched successfully",
    });
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getDueDate = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await CourseSch.findById(courseId).select(
      "startingDate endingDate"
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({
      startingDate: course.startingDate,
      endingDate: course.endingDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const archivedCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    // Fetch the course first
    const course = await CourseSch.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.published = !course.published;
    course.archivedDate = new Date();
    await course.save();

    res.status(200).json({
      message: "Course updated successfully",
      published: course.published,
      archivedDate: course.archivedDate,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCourseBasics = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await CourseSch.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log(course, "course");

    res.status(200).json({
      message: "Course found successfully",
      course,
    });
  } catch (error) {
    console.log("error in getting course basics", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getBasicCoursesByTeacherId = async (req, res) => {
  const { teacherId } = req.query;

  if (!teacherId) {
    return res.status(400).json({ error: "teacherId is required" });
  }

  try {
    const courses = await CourseSch.find({ createdby: teacherId })
      .sort({ createdAt: -1 })
      .select("courseTitle thumbnail _id category") // ⬅️ Use top-level fields
      .populate("category", "title"); // Populate only the 'name' of category

    const simplifiedCourses = courses.map((course) => ({
      courseId: course._id,
      courseTitle: course.courseTitle || "Untitled",
      courseImageUrl: course.thumbnail?.url || null,
      category: course.category?.title || null,
    }));

    res.status(200).json({
      courses: simplifiedCourses,
      message: "Courses fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editCourseInfo = async (req, res) => {
  const { courseId } = req.params;
  const {
    courseTitle,
    category,
    subcategory,
    language,
    teachingPoints,
    requirements,
    courseDescription,
  } = req.body;

  try {
    const course = await CourseSch.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const parsedTeachingPoints = JSON.parse(teachingPoints);
    const parsedRequirements = JSON.parse(requirements);

    course.courseTitle = courseTitle;
    course.category = category;
    course.subcategory = subcategory;
    course.language = language;
    course.teachingPoints = parsedTeachingPoints;
    course.requirements = parsedRequirements;
    course.courseDescription = courseDescription;

    course.save();

    res.status(200).json({ message: "Course updated successfully" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const thumnailChange = async (req, res) => {
  const { courseId } = req.params;
  const thumbnail = req.file;

  try {
    const course = await CourseSch.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (thumbnail) {
      const result = await uploadToCloudinary(
        thumbnail.buffer,
        "course_thumbnails"
      );
      course.thumbnail = {
        url: result.secure_url,
        publicId: result.public_id,
        filename: thumbnail.originalname, // use original filename as alt text
      };

      course.save();
    }
    res.status(200).json({ message: "Thumbnail updated successfully" });
  } catch (error) {
    console.log("error in thumnail change", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};



// export const createCourseSch = async (req, res) => {
//   const createdby = req.user._id;

//   const {
//     courseTitle,
//     category,
//     subcategory,
//     language,
//     courseDescription,
//     teachingPoints,
//     requirements,
//     published,
//     semester,
//     quarter,
//     isGenerateCode,
//   } = req.body;

//   const files = req.files; // multiple files: thumbnail and syllabus
//   const isGenerateCodeBoolean = isGenerateCode === "true";

//   console.log(isGenerateCode, "isGenerateCode")

//   try {
//     let thumbnail = { url: "", altText: "" };
//     let syllabusFile = { url: "", filename: "" };

//     // Upload thumbnail if exists
//     if (files?.thumbnail?.[0]) {
//       const thumb = files.thumbnail[0];
//       const result = await uploadToCloudinary(thumb.buffer, "course_thumbnails");
//       thumbnail.url = result.secure_url;
//       thumbnail.altText = thumb.originalname;
//     }

//     // Upload syllabus if exists
//     if (files?.syllabus?.[0]) {
//       const syllabus = files.syllabus[0];
//       const result = await uploadToCloudinary(syllabus.buffer, "course_syllabi"); // use a separate folder
//       syllabusFile.url = result.secure_url;
//       syllabusFile.filename = syllabus.originalname;
//     }

//     const parsedTeachingPoints = JSON.parse(teachingPoints);
//     const parsedRequirements = JSON.parse(requirements);
//     const parsedSemester = JSON.parse(semester);
//     const parsedQuarter = JSON.parse(quarter);

//     let verificationCode;
//     if (isGenerateCodeBoolean) {
//       const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
//       verificationCode = await bcrypt.hash(randomString, 10);
//     }

//     const course = await CourseSch.create({
//       courseTitle,
//       category,
//       subcategory,
//       thumbnail,
//       syllabus: syllabusFile,
//       language,
//       courseDescription,
//       teachingPoints: parsedTeachingPoints,
//       requirements: parsedRequirements,
//       createdby,
//       published,
//       semester: parsedSemester,
//       quarter: parsedQuarter,
//       verificationCode,
//     });

//     await Enrollment.create({ student: createdby, course: course._id });

//     if (isGenerateCodeBoolean) {
//       // Get teacher's email from user object
//       const teacher = await User.findById(createdby);
//       const teacherEmail = teacher.email;

//       const transporter = nodemailer.createTransport({
//         host: "smtp.gmail.com",
//         port: 465,
//         secure: true,
//         auth: {
//           user: "support@acewallscholars.org",
//           pass: "ecgdupvzkfmbqrrq",
//         },
//       });

//       // Send email with verification code
//       const mailOptions = {
//         from: process.env.EMAIL_FROM,
//         to: teacherEmail,
//         subject: 'Course Enrollment Code',
//         html: `
//         <h1>Course Created Successfully</h1>
//         <p>Your course "${courseTitle}" has been created.</p>
//         <p>Course enrollment code: <strong>${verificationCode}</strong></p>
//         <p>Share this code with your students to allow them to enroll in the course.</p>
//       `
//       };

//       await transporter.sendMail(mailOptions);

//       res.status(201).json({ course, message: "Course created successfully and course enrollment code has been sent to your email" });
//     } else {
//       res.status(201).json({ course, message: "Course created successfully" });
//     }
//   } catch (error) {
//     console.log("Error in createCourseSch:", error);
//     res.status(500).json({ error: error.message });
//   }
// };