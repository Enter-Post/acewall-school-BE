import mongoose from "mongoose";

const AssessmentCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3 },
    weight: { type: Number, required: true, min: 0 },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSch",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual fields for district and school - inherited from course
AssessmentCategorySchema.virtual('districtId', {
  ref: 'CourseSch',
  localField: 'course',
  foreignField: '_id',
  justOne: true,
  options: { select: 'districtId' }
});

AssessmentCategorySchema.virtual('schoolId', {
  ref: 'CourseSch', 
  localField: 'course',
  foreignField: '_id',
  justOne: true,
  options: { select: 'schoolId' }
});

// Ensure virtual fields are included in JSON output
AssessmentCategorySchema.set('toJSON', { virtuals: true });
AssessmentCategorySchema.set('toObject', { virtuals: true });

const AssessmentCategory = mongoose.model(
  "AssessmentCategory",
  AssessmentCategorySchema
);

export default AssessmentCategory;
