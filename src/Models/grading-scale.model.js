// models/GradingScale.js
import mongoose from "mongoose";

const StandardgradingScaleSchema = new mongoose.Schema({
  scale: [
    {
      grade: String, // e.g., A, B+, C
      min: Number, // minimum percentage
      max: Number, // maximum percentage
      letter: String, // corresponding letter grade
    },
  ],
});

const StandardGrading = mongoose.model("StandardGrading", StandardgradingScaleSchema);

export default StandardGrading;