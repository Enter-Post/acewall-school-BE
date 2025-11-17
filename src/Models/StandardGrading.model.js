// models/GradingScale.js
import mongoose from "mongoose";

const StanderdgradingScaleSchema = new mongoose.Schema({
    scale: [
        {
            points: Number, // e.g., A, B+, C
            remarks: String, // e.g., Excellent, Good, Average
            minPercentage: Number, // minimum percentage
            maxPercentage: Number, // maximum percentage
        },
    ],
});

const StandardGrading = mongoose.model("StandardGradingScale", StanderdgradingScaleSchema);

export default StandardGrading;
