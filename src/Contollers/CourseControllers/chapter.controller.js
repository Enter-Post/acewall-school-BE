import mongoose from "mongoose";
import Chapter from "../../Models/chapter.model.sch.js";
import Quarter from "../../Models/quarter.model.js";
import Lesson from "../../Models/lesson.model.sch.js";
import { v2 as cloudinary } from "cloudinary";

export const createChapter = async (req, res) => {
  const quarter = req.params.quarterId;
  const course = req.params.courseId;
  const createdby = req.user._id;
  const { title, description } = req.body;
  const { schoolId, districtId } = req.user;

  try {
    const chapter = await Chapter.create({
      title,
      description,
      quarter,
      course,
      createdby,
      schoolId,
      districtId
    });
    res.status(201).json({ message: "Chapter created successfully", chapter });
  } catch (error) {
    console.log("error in creating chapter", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChapterofCourse = async (req, res) => {
  const { quarterId } = req.params;
  const { schoolId, districtId } = req.user
  try {
    const chapters = await Chapter.find({ quarter: quarterId, isDeleted: false, schoolId, districtId });
    if (!chapters)
      return res
        .status(404)
        .json({ message: "No chapters found for this course" });

    res.status(200).json({
      message: "Chapter found successfully",
      count: chapters.length,
      chapters,
    });
  } catch (error) {
    console.log("error in getting chapters", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteChapter = async (req, res) => {
  const { chapterId } = req.params;
  const { districtId, schoolId } = req.user
  try {
    // Find chapter first (don't delete yet)
    const chapter = await Chapter.findOne({ _id: chapterId, districtId, schoolId });
    if (!chapter)
      return res
        .status(404)
        .json({ message: "No chapters found for this course" });

    // Find all lessons associated with this chapter
    const lessons = await Lesson.find({ chapter: chapterId, districtId, schoolId });

    // Delete all lessons and their Cloudinary files
    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        // Delete Cloudinary files for each lesson
        if (lesson.pdfFiles && lesson.pdfFiles.length > 0) {
          for (const file of lesson.pdfFiles) {
            // Only delete files from Cloudinary (skip Google Drive files)
            if (file.source === 'local' && file.public_id) {
              try {
                await cloudinary.uploader.destroy(file.public_id, {
                  resource_type: "raw",
                });
              } catch (cloudinaryError) {
                console.error(`Failed to delete Cloudinary file ${file.public_id}:`, cloudinaryError);
                // Continue with deletion even if Cloudinary cleanup fails
              }
            }
          }
        }
      }
      // Soft delete all lessons from database
      await Lesson.updateMany({ chapter: chapterId, districtId, schoolId }, { isDeleted: true });
    }

    // Soft delete the chapter
    const deletedChapter = await Chapter.findOneAndUpdate({ _id: chapterId, districtId, schoolId }, {
      isDeleted: true,
      deletedAt: new Date()
    }, { new: true });

    res.status(200).json({
      message: "Chapter deleted successfully",
      chapter: deletedChapter,
    });
  } catch (error) {
    console.log("error in getting chapters", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChapterOfQuarter = async (req, res) => {
  const { courseId, quarterId } = req.params;
  const { schoolId, districtId } = req.user

  try {
    const quarter = await Quarter.findOne({ _id: quarterId, districtId, schoolId });

    if (!quarter) {
      return res.status(404).json({ message: "Quarter not found" });
    }

    const chapters = await Chapter.aggregate([
      {
        $match: {
          quarter: new mongoose.Types.ObjectId(quarterId),
          course: new mongoose.Types.ObjectId(courseId),
          isDeleted: false,
          schoolId: new mongoose.Types.ObjectId(schoolId),
          districtId: new mongoose.Types.ObjectId(districtId)
        },
      },

      { $sort: { createdAt: 1 } },

      // Lookup Quarter
      {
        $lookup: {
          from: "quarters",
          localField: "quarter",
          foreignField: "_id",
          as: "quarter",
        },
      },
      { $unwind: "$quarter" },

      // Lookup Semester via Quarter
      {
        $lookup: {
          from: "semesters",
          localField: "quarter.semester",
          foreignField: "_id",
          as: "semester",
        },
      },
      { $unwind: "$semester" },

      // Optional: Lookup Lessons and Assessments (if needed)
      {
        $lookup: {
          from: "lessons",

          localField: "_id",
          foreignField: "chapter",
          as: "lessons",
          pipeline: [
            {
              $match: { 
                isDeleted: false,
                districtId: new mongoose.Types.ObjectId(districtId),
                schoolId: new mongoose.Types.ObjectId(schoolId)
              },
            },
            {
              $lookup: {
                from: "assessments",
                let: { lessonId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$lesson", "$$lessonId"] },
                          { $eq: ["$type", "lesson-assessment"] },
                          { $eq: ["$isDeleted", false] },
                          { $eq: ["$districtId", new mongoose.Types.ObjectId(districtId)] },
                          { $eq: ["$schoolId", new mongoose.Types.ObjectId(schoolId)] },
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
                as: "lesson_assessments",
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "assessments",

          let: { chapterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$chapter", "$$chapterId"] },
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },
                    { $eq: ["$districtId", new mongoose.Types.ObjectId(districtId)] },
                    { $eq: ["$schoolId", new mongoose.Types.ObjectId(schoolId)] },
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
          as: "chapter_assessments",
        },
      },
    ]);

    if (!chapters || chapters.length === 0) {
      return res
        .status(404)
        .json({ message: "No chapters found for this quarter" });
    }

    res.status(200).json({
      message: "Chapter found successfully",
      count: chapters.length,
      quarterStartDate: quarter.startDate,
      quarterEndDate: quarter.endDate,
      chapters,
    });
  } catch (error) {
    console.error("error in getting chapters with lessons", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChapterwithLessons = async (req, res) => {
  const { chapterId } = req.params;
  const { districtId, schoolId } = req.user
  try {
    const chapters = await Chapter.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(chapterId),
          isDeleted: false,
          districtId: new mongoose.Types.ObjectId(districtId),
          schoolId: new mongoose.Types.ObjectId(schoolId),
        },
      },

      { $sort: { createdAt: 1 } },

      // Lookup Quarter
      {
        $lookup: {
          from: "quarters",
          localField: "quarter",
          foreignField: "_id",
          as: "quarter",
        },
      },
      { $unwind: "$quarter" },

      // Lookup Semester via Quarter
      {
        $lookup: {
          from: "semesters",
          localField: "quarter.semester",
          foreignField: "_id",
          as: "semester",
        },
      },
      { $unwind: "$semester" },

      // Optional: Lookup Lessons and Assessments (if needed)
      {
        $lookup: {
          from: "lessons",

          localField: "_id",
          foreignField: "chapter",
          as: "lessons",
          pipeline: [
            {
              $match: { 
                isDeleted: false,
                districtId: new mongoose.Types.ObjectId(districtId),
                schoolId: new mongoose.Types.ObjectId(schoolId)
              },
            },
            {
              $lookup: {
                from: "assessments",
                let: { lessonId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$lesson", "$$lessonId"] },
                          { $eq: ["$type", "lesson-assessment"] },
                          { $eq: ["$isDeleted", false] },
                          { $eq: ["$districtId", new mongoose.Types.ObjectId(districtId)] },
                          { $eq: ["$schoolId", new mongoose.Types.ObjectId(schoolId)] },
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
                as: "lesson_assessments",
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "assessments",
          let: { chapterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$chapter", "$$chapterId"] },
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },
                    { $eq: ["$districtId", new mongoose.Types.ObjectId(districtId)] },
                    { $eq: ["$schoolId", new mongoose.Types.ObjectId(schoolId)] },
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
          as: "chapter_assessments",
        },
      },
    ]);

    if (!chapters || chapters.length === 0) {
      return res
        .status(404)
        .json({ message: "No chapters found for this quarter" });
    }

    res.status(200).json({
      message: "Chapter found successfully",
      chapter: chapters[0],
    });
  } catch (error) {
    console.error("error in getting chapters with lessons", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editChapter = async (req, res) => {
  const { chapterId } = req.params;
  const { title, description } = req.body;
  const { districtId, schoolId } = req.user
  try {
    const chapter = await Chapter.findOne({ _id: chapterId, districtId, schoolId });
    if (!chapter || chapter.isDeleted) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const lessons = await Lesson.find({ chapter: chapterId, isDeleted: false, districtId, schoolId });
    chapter.title = title;
    chapter.description = description;
    chapter.save();

    res.status(200).json({ message: "Chapter updated successfully" });
  } catch (error) {
    console.log("Error in the Edit Chapter", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getDeletedChapters = async (req, res) => {
  const { courseId } = req.params;
  const { districtId, schoolId } = req.user
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // Authorization check: only teachers and admins can view deleted chapters
    if (userRole !== "teacher" && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // If teacher, verify they own the course
    if (userRole === "teacher") {
      const CourseSch = await import("../../Models/courses.model.sch.js");
      const course = await CourseSch.default.findOne({ _id: courseId, createdby: userId, districtId, schoolId });
      if (!course) {
        return res.status(403).json({ message: "You can only view deleted chapters of your own courses" });
      }
    }

    const deletedChapters = await Chapter.find({ course: courseId, isDeleted: true, districtId, schoolId })
      .sort({ deletedAt: -1 })
      .populate("quarter", "name startDate endDate")
      .populate("createdby", "firstName lastName");

    res.status(200).json({
      message: "Deleted chapters fetched successfully",
      count: deletedChapters.length,
      deletedChapters,
    });
  } catch (error) {
    console.error("Error fetching deleted chapters:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const restoreChapter = async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;
  const { districtId, schoolId } = req.user

  try {
    // Authorization check: only teachers and admins can restore chapters
    if (userRole !== "teacher" && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const chapter = await Chapter.findOne({ _id: chapterId, districtId, schoolId });
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    if (!chapter.isDeleted) {
      return res.status(400).json({ message: "Chapter is not deleted" });
    }

    // If teacher, verify they own the course
    if (userRole === "teacher") {
      const CourseSch = await import("../../Models/courses.model.sch.js");
      const course = await CourseSch.default.findOne({ _id: chapter.course, createdby: userId, districtId, schoolId });
      if (!course) {
        return res.status(403).json({ message: "You can only restore chapters of your own courses" });
      }
    }

    // Restore the chapter
    chapter.isDeleted = false;
    chapter.deletedAt = null;
    await chapter.save();

    res.status(200).json({ message: "Chapter restored successfully", chapter });
  } catch (error) {
    console.error("Error restoring chapter:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
