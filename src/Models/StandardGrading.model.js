// models/GradingScale.js
import mongoose from "mongoose";

const StanderdgradingScaleSchema = new mongoose.Schema({
    scale: [
        {
            grade: Number, // e.g., A, B+, C
            remarks: String, // e.g., Excellent, Good, Average
            min: Number, // minimum percentage
            max: Number, // maximum percentage
        },
    ],
});

const StandardGrading = mongoose.model("StandardGrading", StanderdgradingScaleSchema);

export default StandardGrading;
