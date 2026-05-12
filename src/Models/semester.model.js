import mongoose from "mongoose";

const SemesterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true }, // e.g., "1st Semester 2024"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isArchived: { type: Boolean, default: false }, // to mark if semester is archived
    // District and School isolation for new semesters
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
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Semester = mongoose.models.Semester || mongoose.model("Semester", SemesterSchema);
export default Semester;