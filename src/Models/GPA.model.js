import mongoose from "mongoose";
import { type } from "os";

const GPASchema = new mongoose.Schema(
    {
        gpaScale: [{
            gpa: { type: Number, required: true },
            minPercentage: { type: Number, required: true },
            maxPercentage: { type: Number, required: true },
        }],
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const GPA = mongoose.models.GPA || mongoose.model("GPA", GPASchema);
export default GPA;