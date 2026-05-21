// models/GradingScale.js
import mongoose from "mongoose";

const gradingScaleSchema = new mongoose.Schema({
  scale: [
    {
      grade: String, // e.g., A, B+, C
      min: Number, // minimum percentage
      max: Number, // maximum percentage
      letter: String, // corresponding letter grade
    },
  ],
  isDeleted: { type: Boolean, default: false },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
});

const GradingScale = mongoose.model("GradingScale", gradingScaleSchema);

export default GradingScale;