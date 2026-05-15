import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseInd",
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true, // Optional for backward compatibility
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true, // Optional for backward compatibility
      index: true,
    },
  },
  { timestamps: true }
);


const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
