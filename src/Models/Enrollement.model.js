import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSch",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: Number,
      default: 0, // Percentage completion
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    isDeleted: { type: Boolean, default: false },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
  },
  { timestamps: true }
);

const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);
export default Enrollment;
