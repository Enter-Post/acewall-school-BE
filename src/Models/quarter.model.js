import mongoose from "mongoose";

const QuarterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "1st Quarter 2024"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isArchived: { type: Boolean, default: false }, // to mark if the quarter is archived
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual fields for district and school - inherited from semester
QuarterSchema.virtual('districtId', {
  ref: 'Semester',
  localField: 'semester',
  foreignField: '_id',
  justOne: true,
  options: { select: 'districtId' }
});

QuarterSchema.virtual('schoolId', {
  ref: 'Semester', 
  localField: 'semester',
  foreignField: '_id',
  justOne: true,
  options: { select: 'schoolId' }
});

// Ensure virtual fields are included in JSON output
QuarterSchema.set('toJSON', { virtuals: true });
QuarterSchema.set('toObject', { virtuals: true });

const Quarter = mongoose.models.Quarter || mongoose.model("Quarter", QuarterSchema);
export default Quarter;
