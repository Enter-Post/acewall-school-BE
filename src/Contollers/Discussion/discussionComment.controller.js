import Discussion from "../../Models/discussion.model.js";
import DiscussionComment from "../../Models/discussionComment.model.js";
import { updateGradebookOnSubmission } from "../../Utiles/updateGradebookOnSubmission.js";

export const getDiscussionComments = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 5 } = req.query; // Default to page 1, 5 comments per page

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const discussionComments = await DiscussionComment.find({
      discussion: id,
    })
      .populate("createdby", "profileImg firstName middleName lastName role")
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit));

    const totalComments = await DiscussionComment.countDocuments({
      discussion: id,
    });

    // Add a safe fallback for deleted users
    const sanitizedComments = discussionComments.map((comment) => {
      const user = comment.createdby
        ? comment.createdby
        : {
          firstName: "Deleted",
          lastName: "User",
          profileImg: null,
          role: null,
        };

      return {
        ...comment.toObject(),
        createdby: user,
      };
    });
    res.status(200).json({
      message: "Comments fetched successfully",
      discussionComments: sanitizedComments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log("Error in fetching discussion comments", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendDiscussionComment = async (req, res) => {
  const user = req.user;
  const { text } = req.body;
  const { id } = req.params;

  try {
    const existingComments = await DiscussionComment.find({
      createdby: user._id,
      discussion: id,
    });

    const discussion = await Discussion.findById(id).populate('createdby', 'firstName lastName role');


    if (user.role !== "teacher") {
      if (!discussion.allowResubmission && existingComments.length >= 1) {
        return res.status(409).json({ message: "You have already commented on this discussion" });
      }
      // If resubmission is allowed, student can comment unlimited times
    }

    const dueDate = new Date(discussion.dueDate.date)
      .toISOString()
      .split("T")[0];
    const dueTime = discussion.dueDate.time;
    const dueDateTime = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();

    const override = discussion.studentDueDateOverrides.find(
      o => o.student.toString() === user._id
    );

    let finalDueDate = dueDateTime;

    if (override) {
      if (override.newDueDate) {
        const overDate = new Date(override.newDueDate.date).toISOString().split("T")[0];
        const overTime = override.newDueDate.time;
        finalDueDate = new Date(`${overDate}T${overTime}`);
      }
    }

    let status = "before due date";
    if (now > finalDueDate) {
      status = "after due date";
    }

    const newDiscussionComment = new DiscussionComment({
      text,
      role: user.role,
      createdby: user._id,
      status,
      discussion: id,
      allowResubmission: discussion.allowResubmission,
    });

    await newDiscussionComment.save();
    res.status(200).json({
      message: "Comment sent successfully",
      newDiscussionComment,
    });
  } catch (error) {
    console.log("error in the discussion comment", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    const Comment = await DiscussionComment.findByIdAndDelete(id);

    if (!Comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("error in deleting comment", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const gradeDiscussionofStd = async (req, res) => {
  const { discID, discussionCommentId } = req.params;
  const { obtainedMarks } = req.body;

  try {
    const discussion = await Discussion.findById(discID)
      .populate("semester quarter category");
    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const discussionComment = await DiscussionComment.findById(
      discussionCommentId
    );
    if (!discussionComment) {
      return res.status(404).json({ message: "Discussion comment not found" });
    }

    // Student who made the comment
    const studentId = discussionComment.createdby;

    // Prevent grading same student's comment twice
    const alreadyGraded = await DiscussionComment.findOne({
      discussion: discID,
      createdby: studentId,
      isGraded: true,
    });

    if (alreadyGraded) {
      return res.status(400).json({
        message: "This student has already been graded for this discussion.",
      });
    }

    // Grade the comment
    discussionComment.gradedBy = req.user._id;
    discussionComment.marksObtained = obtainedMarks;
    discussionComment.isGraded = true;

    await discussionComment.save();

    // ⭐ IMPORTANT: UPDATE GRADEBOOK NOW!
    await updateGradebookOnSubmission(
      studentId,
      discussion.course,     // courseId
      discID,                // itemId
      "discussion"           // type
    );

    res.status(200).json({ message: "Marks graded successfully" });
  } catch (error) {
    console.error("Error grading discussion comment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const isCommentedInDiscussion = async (req, res) => {
 const user = req.user;
  const { id } = req.params;

  const existingComments = await DiscussionComment.find({
    createdby: user._id,
    discussion: id,
  });

  const discussion = await Discussion.findById(id);

  // For teachers, always return false (they can always comment)
  if (user.role === "teacher") {
    return res.status(200).json({
      commented: false,
      canComment: true,
      message: "Teacher can always comment"
    });
  }

  // For students, check comment limits based on resubmission setting
  if (!discussion.allowResubmission && existingComments.length >= 1) {
    return res.status(200).json({
      commented: true,
      canComment: false,
      message: "Student has already commented and resubmission is not allowed"
    });
  }

  // If resubmission is allowed, student can comment unlimited times
  // Student can still comment
  return res.status(200).json({
    commented: existingComments.length > 0,
    canComment: true,
    message: existingComments.length > 0 ? "Student can still comment (resubmission allowed)" : "Student has not commented yet"
  });
};
