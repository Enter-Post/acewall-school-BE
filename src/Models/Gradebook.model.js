import mongoose from "mongoose";

const gradebookItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemType: { type: String, enum: ["assessment", "discussion"], required: true },

    title: String,
    categoryId: mongoose.Schema.Types.ObjectId,
    categoryName: String,

    maxPoints: Number,
    studentPoints: Number,
}, { _id: false });

const quarterSchema = new mongoose.Schema({
    quarterId: mongoose.Schema.Types.ObjectId,
    quarterTitle: String,

    gradePercentage: Number,
    gpa: Number,
    letterGrade: String,

    // ⭐ Standard grading for each quarter
    standardGrade: {
        points: Number,
        remarks: String,
    },

    categoryBreakdown: [
        {
            categoryId: mongoose.Schema.Types.ObjectId,
            categoryName: String,
            percentage: Number,
            weight: Number,
        }
    ],

    items: [gradebookItemSchema],
}, { _id: false });

const semesterSchema = new mongoose.Schema({
    semesterId: mongoose.Schema.Types.ObjectId,
    semesterTitle: String,

    gradePercentage: Number,
    letterGrade: String,

    quarters: [quarterSchema],
}, { _id: false });

const GradebookSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

    courseTitle: String,

    semesters: [semesterSchema],

    finalPercentage: Number,
    finalGPA: Number,
    finalLetterGrade: String,

    // ⭐ Final standard-based grading (overall course)
    standardGrade: {
        points: Number,
        remarks: String,
    },

    totalAssessments: Number,

    lastUpdated: { type: Date, default: Date.now }
});

const Gradebook = mongoose.model("Gradebook", GradebookSchema);
export default Gradebook;