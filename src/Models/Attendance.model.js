import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSch",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "not marked"],
      default: "not marked",
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The teacher who marked it
      required: true,
    },
    note: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔹 CRITICAL: Compound Index
// This ensures that for a specific class on a specific day,
// a student can only have ONE attendance record.
AttendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", AttendanceSchema);
export default Attendance;
