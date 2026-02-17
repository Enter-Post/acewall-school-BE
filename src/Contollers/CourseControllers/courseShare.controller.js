import CourseShare from "../../Models/CourseShare.model.js";
import CourseSch from "../../Models/courses.model.sch.js";
import {
  processCourseImport,
  fetchFullCourseData,
} from "./courseShare.service.js";

// --- COURSE SHARING FEATURES ---

export const shareCourse = async (req, res) => {
  try {
    const { courseId, teacherIds } = req.body;
    const sharedBy = req.user._id;

    // Security: Only teachers can share
    if (
      req.user.role !== "teacher" &&
      req.user.role !== "admin" &&
      req.user.role !== "instructor"
    ) {
      return res
        .status(403)
        .json({ message: "Only teachers can share courses" });
    }

    const course = await CourseSch.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Security: Only owner can share
    if (
      course.createdby.toString() !== sharedBy.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only the course owner can share it" });
    }

    const shareRecords = [];
    for (const sharedWith of teacherIds) {
      // Prevent sharing with self
      if (sharedWith === sharedBy.toString()) continue;

      // Prevent duplicate share entries
      const exists = await CourseShare.findOne({
        course: courseId,
        sharedWith,
        status: { $ne: "rejected" },
      });

      if (!exists) {
        shareRecords.push({
          course: courseId,
          sharedBy,
          sharedWith,
          status: "pending",
        });
      }
    }

    if (shareRecords.length > 0) {
      await CourseShare.insertMany(shareRecords);
    }

    res.status(200).json({
      success: true,
      message: "Course shared successfully",
      sharedCount: shareRecords.length,
    });
  } catch (error) {
    console.error("Share Course Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSharedWithMe = async (req, res) => {
  try {
    const userId = req.user._id;

    const sharedCourses = await CourseShare.find({
      sharedWith: userId,
      status: "pending",
    })
      .populate(
        "course",
        "courseTitle thumbnail courseDescription language category",
      )
      .populate("sharedBy", "firstName lastName profileImg")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sharedCourses.length,
      data: sharedCourses,
    });
  } catch (error) {
    console.error("Get Shared Courses Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user._id;

    const share = await CourseShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ message: "Share request not found" });
    }

    // Security: Validate share belongs to logged-in teacher
    if (share.sharedWith.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this share",
      });
    }

    // Prevent importing same share twice
    if (share.status === "imported") {
      return res.status(400).json({ message: "Course already imported" });
    }

    // Fetch full course data using service
    const fullData = await fetchFullCourseData(share.course);

    // Import course using reusable service
    const savedCourse = await processCourseImport(
      fullData,
      userId,
      "(Shared Copy)",
    );

    // Mark share as imported
    share.status = "imported";
    await share.save();

    res.status(201).json({
      success: true,
      message: "Course Imported Successfully",
      newCourseId: savedCourse._id,
    });
  } catch (error) {
    console.error("Accept Share Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user._id;

    const share = await CourseShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ message: "Share request not found" });
    }

    // Security: Validate share belongs to logged-in teacher
    if (share.sharedWith.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to reject this share",
      });
    }

    share.status = "rejected";
    await share.save();

    res.status(200).json({
      success: true,
      message: "Share request rejected",
    });
  } catch (error) {
    console.error("Reject Share Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
