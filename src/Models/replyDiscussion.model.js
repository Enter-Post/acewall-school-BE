import mongoose from "mongoose";

const ReplyDiscussionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "teacherAsStudent"],
      required: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionComment",
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Virtual fields for district and school - inherited from comment->discussion->course
ReplyDiscussionSchema.virtual('districtId', {
  ref: 'DiscussionComment',
  localField: 'comment',
  foreignField: '_id',
  justOne: true,
  options: { select: 'districtId' }
});

ReplyDiscussionSchema.virtual('schoolId', {
  ref: 'DiscussionComment', 
  localField: 'comment',
  foreignField: '_id',
  justOne: true,
  options: { select: 'schoolId' }
});

// Ensure virtual fields are included in JSON output
ReplyDiscussionSchema.set('toJSON', { virtuals: true });
ReplyDiscussionSchema.set('toObject', { virtuals: true });

const DiscussionReply = mongoose.model("Reply", ReplyDiscussionSchema);

export default DiscussionReply;
