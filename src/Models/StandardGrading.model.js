// models/GradingScale.js
import mongoose from "mongoose";

const StanderdgradingScaleSchema = new mongoose.Schema({
    scale: [
        {
            points: { type: Number, required: true }, // e.g., A, B+, C
            remarks: { type: String, required: true }, // e.g., Excellent, Good, Average
            minPercentage: { type: Number, required: true }, // minimum percentage
            maxPercentage: { type: Number, required: true }, // maximum percentage
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
