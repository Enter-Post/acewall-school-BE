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
    districtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "District",
        required: true,
        index: true,
    },
    isDeleted: { type: Boolean, default: false }
});

const StandardGrading = mongoose.model("StandardGradingScale", StanderdgradingScaleSchema);

export default StandardGrading;
