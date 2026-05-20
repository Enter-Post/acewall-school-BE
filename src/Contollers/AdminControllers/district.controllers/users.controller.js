import mongoose from "mongoose";
import User from "../../../Models/user.model.js";
import CourseSch from "../../../Models/courses.model.sch.js";

export const getTeacherById = async (req, res) => {
    const { id } = req.params;
    const { districtId } = req.user
    const { schoolId } = req.params

    try {
        const teacher = await User.findOne({ _id: id, districtId, schoolId }).select(
            " id firstName middleName lastName email profileImg createdAt phone homeAddress mailingAddress pronoun gender role"
        );
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        const courses = await CourseSch.aggregate([
            {
                $match: {
                    createdby: new mongoose.Types.ObjectId(id),
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    districtId: new mongoose.Types.ObjectId(districtId)
                }
            },
            { $project: { courseTitle: 1, courseDescription: 1, _id: 1 } },
        ]);

        res.status(200).json({ teacher, courses });
    } catch (error) {
        console.error("Error fetching teacher by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};