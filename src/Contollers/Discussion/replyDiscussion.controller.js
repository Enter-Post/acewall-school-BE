import mongoose from "mongoose";
import DiscussionReply from "../../Models/replyDiscussion.model.js";
export const getreplyofComment = async (req, res) => {
  const { commentId } = req.params;
  const { page = 1, limit = 5 } = req.query; // Defaults: page 1, 5 replies per page
  const { districtId, schoolId } = req.user;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const replies = await DiscussionReply.find({ comment: commentId, districtId, schoolId })
      .sort({ createdAt: -1 }) // Most recent replies first
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdby", "firstName lastName profileImg"); // optional

    const totalReplies = await DiscussionReply.countDocuments({
      comment: commentId,
      districtId,
      schoolId
    });

    res.status(200).json({
      message: "Replies fetched successfully",
      replies,
      totalPages: Math.ceil(totalReplies / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log("Error in getreplyofComment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendReplyofComment = async (req, res) => {
  const user = req.user;
  const { commentId } = req.params;
  const { text } = req.body;
  const { districtId, schoolId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: "Invalid commentId" });
  }

  try {
    const newReply = new DiscussionReply({
      text,
      role: user.role,
      createdby: user._id,
      comment: commentId,
      districtId,
      schoolId,
    });

    await newReply.save();
    res.status(200).json({ message: "Reply sent successfully", newReply });
  } catch (error) {
    console.log("error in sendReplyofComment", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getReplyCount = async (req, res) => {
  const { commentId } = req.params;
  const { districtId, schoolId } = req.user;

  try {
    const replyCount = await DiscussionReply.countDocuments({ comment: commentId, districtId, schoolId });

    res.status(200).json({
      message: "Total reply count fetched successfully",
      replyCount,
    });
  } catch (error) {
    console.log("Error fetching reply count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
