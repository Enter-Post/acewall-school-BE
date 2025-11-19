import mongoose from "mongoose";

const SemesterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true }, // e.g., "1st Semester 2024"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isArchived: { type: Boolean, default: false }, // to mark if the semester is archived
  },
  { timestamps: true }
);

const Semester = mongoose.models.Semester || mongoose.model("Semester", SemesterSchema);
export default Semester;