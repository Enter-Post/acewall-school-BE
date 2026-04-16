import mongoose from "mongoose";
import Discussion from "../../Models/discussion.model.js";
import DiscussionComment from "../../Models/discussionComment.model.js";
import { uploadToCloudinary } from "../../lib/cloudinary-course.config.js";
import Enrollment from "../../Models/Enrollement.model.js";

export const createDiscussion = async (req, res) => {
  const {
    topic,
    description,
    course,
    type,
    totalMarks,
    dueDate,
    chapter,
    lesson,
    category,
    semester,
    quarter
  } = req.body;
  const files = req.files;
  const createdby = req.user._id;

  console.log(req.body, "req.body");

  let uploadedFiles = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer, "discussion_files");

      uploadedFiles.push({
        url: result.secure_url,
        publicId: result.public_id,
        type: file.mimetype,
        filename: file.originalname,
      });
    }
  }

  const parsedDueDate = JSON.parse(dueDate);

  const dueDateObject = {
    date: new Date(parsedDueDate.dateTime).toISOString().split("T")[0],
    time: new Date(parsedDueDate.dateTime).toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  try {
    const discussion = new Discussion({
      topic,
      description,
      course,
      type,
      files: uploadedFiles,
      createdby,
      totalMarks,
      dueDate: dueDateObject,
      chapter,
      lesson,
      category,
      semester,
      quarter
    });

    discussion.save();
    return res
      .status(201)
      .json({ message: "Discussion created successfully", discussion });
  } catch (error) {
    console.log("error in creating discussion", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDiscussionsOfTeacher = async (req, res) => {
  const teacherId = req.user._id;
  try {
    const discussion = await Discussion.find({
      createdby: teacherId,
    }).populate({
      path: "course",
      select: "courseTitle thumbnail",
    });

    res
      .status(200)
      .json({ message: "Discussions fetched successfully here", discussion });
  } catch (error) {
    console.log("error in getting discussion", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDiscussionbyId = async (req, res) => {
  const id = req.params.id;
  const userId = req.user._id;
  try {
    const discussion = await Discussion.findById(id)
      .populate("course", "courseTitle thumbnail")
      .populate("chapter", "title")
      .populate("lesson", "title")
      .populate("createdby", "firstName middleName lastName profileImg")

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const exists = await Enrollment.findOne({
      student: userId,
      course: discussion.course,
    });

    if (!exists) {
      return res
        .status(404)
        .json({ message: "You are not enrolled in this course" });
    }

    res
      .status(200)
      .json({ message: "Discussion fetched successfully", discussion });
  } catch (error) {
    console.log("error in getting discussion by ID", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const discussionforStudent = async (req, res) => {
  let userId = req.user._id;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    userId = new mongoose.Types.ObjectId(userId);

    const studentEnrollment = await Enrollment.find({ student: userId });
    const allEnrolledCourseIds = studentEnrollment.map((enr) => enr.course);

    const discussions = await Discussion.find({
      $or: [
        { course: { $in: allEnrolledCourseIds } },
      ]
    })
      .populate("course", "courseTitle thumbnail")
      .populate("category", "title")
      .populate("chapter", "title")
      .populate("lesson", "title")
      .populate("createdby", "firstName middleName lastName profileImg")
      .select("-files");

    res.status(200).json({
      message: "Discussions fetched successfully",
      discussionCount: discussions.length,
      discussions
    });
  } catch (error) {
    console.log("error in discussion for student", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const chapterDiscussions = async (req, res) => {
  const { chapterId } = req.params
  try {
    const discussion = await Discussion.find({ chapter: chapterId }).populate("course", "courseTitle thumbnail")
    if (!discussion || discussion.length === 0) {
      return res.status(404).json({ message: "No discussions found for this chapter" });
    }
    res.status(200).json({ message: "Discussions fetched successfully", discussion })
  } catch (error) {
    console.log("error in fetching chapter discussions", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const lessonDiscussions = async (req, res) => {
  const { lessonId } = req.params
  try {
    const discussion = await Discussion.find({ lesson: lessonId }).populate("course", "courseTitle thumbnail")
    if (!discussion || discussion.length === 0) {
      return res.status(404).json({ message: "No discussions found for this lesson" });
    }
    res.status(200).json({ message: "Discussions fetched successfully", discussion })
  } catch (error) {
    console.log("error in fetching chapter discussions", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const courseDiscussions = async (req, res) => {
  const { courseId } = req.params
  try {
    const discussion = await Discussion.find({ course: courseId }).populate("course", "courseTitle thumbnail")
    if (!discussion || discussion.length === 0) {
      return res.status(404).json({ message: "No discussions found for this lesson" });
    }
    res.status(200).json({ message: "Discussions fetched successfully", discussion })
  } catch (error) {
    console.log("error in fetching chapter discussions", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
} 


export const setDueDateForStudentsDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { studentIds, newDueDate } = req.body;

    // 1. Basic Validation
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
        errorCode: "VAL_001"
      });
    }

    if (!newDueDate || !newDueDate.date) {
      return res.status(400).json({
        success: false,
        message: "Due date is required",
        errorCode: "VAL_002"
      });
    }

    // 2. Parse and Validate the Date
    const parsedDate = new Date(newDueDate.date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided",
        errorCode: "VAL_003"
      });
    }

    // 3. Find the Discussion
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
        errorCode: "DIS_016"
      });
    }

    // Define the common override object
    const dueDateObj = {
      date: parsedDate,
      time: newDueDate.time || "00:00" // Default if time is missing
    };

    // 4. Sanitize student IDs and filter out invalid ObjectIds
    const validStudentIds = studentIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    // 5. Loop through valid students
    for (const studentId of validStudentIds) {
      // Check if the student is actually in the course associated with this discussion
      const enrollment = await Enrollment.findOne({
        course: discussion.course,
        student: studentId
      });

      // Skip students not enrolled in this specific course
      if (!enrollment) continue;

      // Check if an override already exists for this student
      const studentOverrideIndex = discussion.studentDueDateOverrides.findIndex(
        (override) => override.student.toString() === studentId.toString()
      );

      if (studentOverrideIndex !== -1) {
        // Update existing override
        discussion.studentDueDateOverrides[studentOverrideIndex].newDueDate = dueDateObj;
      } else {
        // Add new override record
        discussion.studentDueDateOverrides.push({
          student: new mongoose.Types.ObjectId(studentId),
          newDueDate: dueDateObj
        });
      }
    }

    // 6. Explicitly mark as modified (required for mixed arrays in Mongoose)
    discussion.markModified('studentDueDateOverrides');

    await discussion.save();

    return res.status(200).json({
      success: true,
      message: `Due dates updated successfully for ${validStudentIds.length} students.`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const toggleAllowResubmission = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { allowResubmission } = req.body;

    // Validate and convert the allowResubmission parameter
    const allowResubmissionValue = Boolean(allowResubmission);

    // Find the discussion
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
        errorCode: "DISC_018"
      });
    }

    // Update the allowResubmission field
    discussion.allowResubmission = allowResubmissionValue;
    await discussion.save();

    return res.status(200).json({
      success: true,
      message: `Allow resubmission ${allowResubmissionValue ? 'enabled' : 'disabled'} successfully`,
      allowResubmission: discussion.allowResubmission
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
