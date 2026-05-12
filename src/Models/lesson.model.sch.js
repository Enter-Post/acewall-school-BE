import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    pdfFiles: [
      {
        url: { type: String},
        public_id: { type: String },
        filename: { type: String },
        type: { type: String },
        source: { type: String, enum: ['local', 'google_drive'], default: 'local' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    youtubeLinks: { type: String },
    otherLink: { type: String },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    published: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);


const Lesson = mongoose.model("Lesson", LessonSchema);
export default Lesson;
