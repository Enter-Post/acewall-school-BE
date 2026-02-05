import mongoose from "mongoose";

const PacingChartSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSch",
      required: true,
      unique: true, // Assuming one pacing chart per course
    },
    items: [
      {
        startDate: { type: Date },
        endDate: { type: Date },
        week: { type: String },
        topic: { type: String },
        description: { type: String },
        objectives: [{ type: String }],
        resources: [{ type: String }],
      },
    ],
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const PacingChart = mongoose.model("PacingChart", PacingChartSchema);
export default PacingChart;
