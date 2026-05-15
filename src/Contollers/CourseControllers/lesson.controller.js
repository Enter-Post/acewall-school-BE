import { uploadToCloudinary } from "../../lib/cloudinary-course.config.js";
import Lesson from "../../Models/lesson.model.sch.js";
import { v2 as cloudinary } from "cloudinary";

export const createLesson = async (req, res) => {
  const createdby = req.user._id;
  const { title, description, youtubeLinks, otherLink, chapter, googleDriveFiles } = req.body;
  const { schoolId, districtId } = req.user
  const pdfFiles = req.files;

  try {
    let uploadedFiles = [];

    // Handle local PDF files
    if (pdfFiles && pdfFiles.length > 0) {
      for (const file of pdfFiles) {
        const result = await uploadToCloudinary(file.buffer, "lesson_pdfs");

        uploadedFiles.push({
          url: result.secure_url,
          public_id: result.public_id,
          filename: file.originalname,
          type: file.mimetype,
          source: 'local',
        });
      }
    }

    // Handle Google Drive files
    if (googleDriveFiles) {
      try {
        const driveFiles = JSON.parse(googleDriveFiles);
        if (Array.isArray(driveFiles)) {
          driveFiles.forEach(file => {
            uploadedFiles.push({
              url: file.url,
              filename: file.filename,
              type: file.type || 'application/pdf',
              source: 'google_drive',
            });
          });
        }
      } catch (err) {
        console.error("Error parsing Google Drive files:", err);
      }
    }

    const newLesson = new Lesson({
      title,
      description,
      youtubeLinks,
      otherLink,
      pdfFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined, // If no PDF files, set as undefined
      chapter,
      schoolId,
      districtId,
      createdby,
    });

    await newLesson.save();

    res.status(201).json({ message: "Lesson created successfully", newLesson });
  } catch (error) {
    console.log("error in creating lesson", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { districtId, schoolId } = req.user
  try {
    // Find lesson first (don't delete yet)
    const lesson = await Lesson.findOne({ _id: lessonId, districtId, schoolId });
    if (!lesson || lesson.isDeleted)
      return res
        .status(404)
        .json({ message: "No lesson found for this course" });

    // Delete all PDF files from Cloudinary
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

    // Soft delete the lesson
    await Lesson.findOneAndUpdate({ _id: lessonId, districtId, schoolId }, {
      isDeleted: true,
      deletedAt: new Date()
    });

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.log("error in deleting lesson", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLessons = async (req, res) => {
  const { chapterId } = req.params;
  const { schoolId, districtId } = req.user
  try {
    const lessons = await Lesson.find({ chapter: chapterId, isDeleted: false, schoolId, districtId });
    if (!lessons)
      return res
        .status(404)
        .json({ message: "No lesson found for this course" });

    res.status(200).json({ message: "Lessons found successfully", lessons });
  } catch (error) {
    console.log("error in getting lessons", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { title, description, youtubeLinks, otherLink } = req.body;
  const { districtId, schoolId } = req.user

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title and description are required" });
  }

  try {
    const updatedLesson = await Lesson.findOneAndUpdate(
      { _id: lessonId, districtId, schoolId },
      { title, description, youtubeLinks, otherLink },
      { new: true, runValidators: true }
    );

    if (!updatedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res
      .status(200)
      .json({ message: "Lesson edited successfully", lesson: updatedLesson });
  } catch (error) {
    console.error("Error editing lesson:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteFile = async (req, res) => {
  const { lessonId, fileId } = req.params;
  const { districtId, schoolId } = req.user

  try {
    const lesson = await Lesson.findOne({ _id: lessonId, districtId, schoolId });
    if (!lesson || lesson.isDeleted) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const fileIndex = lesson.pdfFiles.findIndex(
      (file) => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = lesson.pdfFiles[fileIndex];

    await cloudinary.uploader.destroy(file.public_id, {
      resource_type: "raw",
    });

    lesson.pdfFiles.splice(fileIndex, 1);
    await lesson.save();

    return res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getallFilesofLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { districtId, schoolId } = req.user

  try {
    const lesson = await Lesson.findOne({ _id: lessonId, districtId, schoolId });

    if (!lesson || lesson.isDeleted) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    let totalSizeinMB = 0;

    const filesWithSize = await Promise.all(
      lesson.pdfFiles.map(async (file) => {
        try {
          const metadata = await cloudinary.api.resource(file.public_id);
          totalSizeinMB += metadata.bytes / (1024 * 1024);
          return {
            ...file._doc,
            size: metadata.bytes, // size in bytes
            readableSize: `${(metadata.bytes / (1024 * 1024)).toFixed(2)}`, // optional: human-readable
          };
        } catch (err) {
          console.error(`Failed to fetch metadata for ${file.public_id}:`, err);
          return { ...file._doc, size: null, readableSize: "Unavailable" };
        }
      })
    );

    console.log(totalSizeinMB, "totalSizeinMB");

    res.status(200).json({
      message: "Files with sizes fetched successfully",
      files: filesWithSize,
      totalSizeinMB: totalSizeinMB.toFixed(2),
    });
  } catch (error) {
    console.log("Error in getting all files:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addMoreFiles = async (req, res) => {
  const { lessonId } = req.params;
  const { districtId, schoolId } = req.user
  const pdfFiles = req.files;

  try {
    const lesson = await Lesson.findOne({ _id: lessonId, districtId, schoolId });
    if (!lesson || lesson.isDeleted) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    for (const file of pdfFiles) {
      const result = await uploadToCloudinary(file.buffer, "lesson_files");
      lesson.pdfFiles.push({
        url: result.secure_url,
        filename: file.originalname,
        public_id: result.public_id,
      });
    }

    await lesson.save();

    res.status(200).json({ message: "Files added successfully" });
  } catch (error) {
    console.error("Error adding files:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDeletedLessons = async (req, res) => {
  const { chapterId } = req.params;
  const { districtId, schoolId } = req.user
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // Authorization check: only teachers and admins can view deleted lessons
    if (userRole !== "teacher" && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get the chapter to verify course ownership
    const Chapter = await import("../../Models/chapter.model.sch.js");
    const chapter = await Chapter.default.findOne({ _id: chapterId, districtId, schoolId }).populate("course");
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // If teacher, verify they own the course
    if (userRole === "teacher") {
      const CourseSch = await import("../../Models/courses.model.sch.js");
      const course = await CourseSch.default.findOne({ _id: chapter.course._id, createdby: userId, districtId, schoolId });
      if (!course) {
        return res.status(403).json({ message: "You can only view deleted lessons of your own courses" });
      }
    }

    const deletedLessons = await Lesson.find({ chapter: chapterId, isDeleted: true, districtId, schoolId })
      .sort({ deletedAt: -1 })
      .populate("chapter", "title");

    res.status(200).json({
      message: "Deleted lessons fetched successfully",
      count: deletedLessons.length,
      deletedLessons,
    });
  } catch (error) {
    console.error("Error fetching deleted lessons:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const restoreLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { districtId, schoolId } = req.user
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // Authorization check: only teachers and admins can restore lessons
    if (userRole !== "teacher" && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, districtId, schoolId }).populate("chapter");
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!lesson.isDeleted) {
      return res.status(400).json({ message: "Lesson is not deleted" });
    }

    // If teacher, verify they own the course
    if (userRole === "teacher") {
      const Chapter = await import("../../Models/chapter.model.sch.js");
      const chapter = await Chapter.default.findOne({ _id: lesson.chapter._id, districtId, schoolId }).populate("course");
      const CourseSch = await import("../../Models/courses.model.sch.js");
      const course = await CourseSch.default.findOne({ _id: chapter.course._id, createdby: userId, districtId, schoolId });
      if (!course) {
        return res.status(403).json({ message: "You can only restore lessons of your own courses" });
      }
    }

    // Restore the lesson
    lesson.isDeleted = false;
    lesson.deletedAt = null;
    await lesson.save();

    res.status(200).json({ message: "Lesson restored successfully", lesson });
  } catch (error) {
    console.error("Error restoring lesson:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
