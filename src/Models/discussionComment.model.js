import mongoose from "mongoose";

const DiscussionCommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "teacherAsStudent"],
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["after due date", "before due date"] },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Teacher who graded
    },
    marksObtained: { type: Number, default: 0 },
    isGraded: { type: Boolean, default: false },
    allowResubmission: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: false, // Optional for backward compatibility
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: false, // Optional for backward compatibility
      index: true,
    },
  },
  { timestamps: true }
);

// Ensure virtual fields are included in JSON output
DiscussionCommentSchema.set('toJSON', { virtuals: true });
DiscussionCommentSchema.set('toObject', { virtuals: true });

const DiscussionComment = mongoose.model("DiscussionComment", DiscussionCommentSchema);

export default DiscussionComment;