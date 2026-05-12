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
  },
  { timestamps: true }
);

// Virtual fields for district and school - inherited from course
commentSchema.virtual('districtId', {
  ref: 'CourseInd',
  localField: 'course',
  foreignField: '_id',
  justOne: true,
  options: { select: 'districtId' }
});

commentSchema.virtual('schoolId', {
  ref: 'CourseInd', 
  localField: 'course',
  foreignField: '_id',
  justOne: true,
  options: { select: 'schoolId' }
});

// Ensure virtual fields are included in JSON output
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
