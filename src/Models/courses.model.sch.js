import mongoose from "mongoose";

const SchCourseSchema = new mongoose.Schema(
  {
    courseTitle: { type: String, required: true, minlength: 1, maxlength: 100 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    language: { type: String, required: true, default: "English" },
    thumbnail: {
      url: { type: String, required: true },
      publicId: { type: String },
      filename: { type: String, maxlength: 100 },
    },
    courseDescription: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 4000,
    },
    syllabus: {
      url: { type: String, default: "" },
      filename: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
      source: { type: String, default: "local" },
    },
    teachingPoints: [{ type: String, maxlength: 120, minlength: 1 }],
    requirements: [{ type: String, maxlength: 120, minlength: 1 }],
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // BCPS RBAC: School and District isolation
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
      index: true,
    },

    semester: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
      },
    ],
    quarter: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quarter",
      },
    ],
    published: { type: Boolean, default: false },
    archivedDate: { type: Date },
    courseCode: { type: String, unique: true },
    commentsEnabled: { type: Boolean, default: true },
    gradingSystem: { type: String, enum: ["normalGrading", "StandardGrading"], default: "normalGrading" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for efficient filtering
SchCourseSchema.index({ districtId: 1, schoolId: 1 });
SchCourseSchema.index({ districtId: 1, schoolId: 1, published: 1 });
SchCourseSchema.index({ schoolId: 1, createdby: 1 });

const CourseSch = mongoose.model("CourseSch", SchCourseSchema);
export default CourseSch;
