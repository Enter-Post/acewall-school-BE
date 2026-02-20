import mongoose from "mongoose";

const CourseShareSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSch",
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "imported", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Index for efficient queries
CourseShareSchema.index({ sharedWith: 1, status: 1 });
CourseShareSchema.index({ course: 1, sharedWith: 1 });

const CourseShare = mongoose.model("CourseShare", CourseShareSchema);

export default CourseShare;
