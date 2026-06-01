import mongoose from "mongoose";
import User from "../../../Models/user.model.js";
import CourseSch from "../../../Models/courses.model.sch.js";
import School from "../../../Models/School.model.js";
import Enrollment from "../../../Models/Enrollement.model.js";

export const getTeacherById = async (req, res) => {
    const { id } = req.params;
    const { schoolId } = req.query;
    let districtId;
    const user = req.user

    try {
        if (user.role == "super_admin") {
            districtId = req.query.districtId;
        } else {
            districtId = user.districtId;
        }

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

export const getAdminById = async (req, res) => {
    const { id } = req.params;
    let districtId;
    const user = req.user

    try {
        if (user.role == "super_admin") {
            districtId = req.query.districtId;
        } else {
            districtId = user.districtId;
        }

        const admin = await User.findOne({ _id: id, districtId }).select(
            " id firstName middleName lastName email profileImg createdAt phone homeAddress mailingAddress pronoun gender role"
        );
        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }

        res.status(200).json({ admin });
    } catch (error) {
        console.error("Error fetching admin by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getStudentById = async (req, res) => {
    const { id } = req.params;
    const { schoolId } = req.query;
    let districtId;
    const user = req.user

    try {
        if (user.role == "super_admin") {
            districtId = req.query.districtId;
        } else {
            districtId = user.districtId;
        }

        const student = await User.findOne({ _id: id, districtId, schoolId }).select(
            "_id firstName middleName lastName email profileImg createdAt phone homeAddress mailingAddress pronoun gender role"
        );
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        const enrollments = await Enrollment.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(id),
                    schoolId: new mongoose.Types.ObjectId(schoolId),
                    districtId: new mongoose.Types.ObjectId(districtId),
                    isDeleted: false
                }
            },
            {
                $lookup: {
                    from: "coursesches",
                    localField: "course",
                    foreignField: "_id",
                    as: "course"
                }
            },
            {
                $unwind: {
                    path: "$course",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    enrolledAt: 1,
                    progress: 1,
                    completed: 1,
                    schoolId: 1,
                    districtId: 1,
                    "course._id": 1,
                    "course.courseTitle": 1,
                    "course.courseDescription": 1,
                    "course.courseCode": 1,
                    "course.thumbnail": 1
                }
            }
        ]);

        res.status(200).json({ student, enrollments });
    } catch (error) {
        console.error("Error fetching student by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateUser = async (req, res) => {
    const userId = req.params.id;
    const districtId = req.user.districtId || req.body.districtId;
    const schoolId = req.params.schoolId || req.body.schoolId || req.body.school;
    const { role } = req.body;

    try {
        let updatedFields = { ...req.body };
        let unsetFields = {};

        if (updatedFields.pronoun === "") {
            unsetFields.pronoun = 1;
            delete updatedFields.pronoun;
        }
        if (updatedFields.gender === "") {
            unsetFields.gender = 1;
            delete updatedFields.gender;
        }

        if (role === "admin") {
            const admin = await User.findOne({ _id: userId, districtId });
            if (!admin) {
                return res.status(404).json({ message: "Admin not found." });
            }
        }
        else if (role === "teacher") {
            const query = { _id: userId, districtId };
            if (schoolId) query.schoolId = schoolId;
            const teacher = await User.findOne(query);
            if (!teacher) {
                return res.status(404).json({ message: "Teacher not found." });
            }
        }
        else if (role === "student") {
            const query = { _id: userId, districtId };
            if (schoolId) query.schoolId = schoolId;
            const student = await User.findOne(query);
            if (!student) {
                return res.status(404).json({ message: "Student not found." });
            }
        }

        let updateQuery = { $set: updatedFields };
        if (Object.keys(unsetFields).length > 0) {
            updateQuery.$unset = unsetFields;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateQuery,
            { new: true, runValidators: true }
        );

        res.json({ message: "User Updated Successfully", updatedUser });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ message: "Update failed", error: err.message });
    }
};

export const getDistrictAdmins = async (req, res) => {
    const { districtId } = req.params;
    try {
        const admins = await User.find({
            role: "district_admin",
            districtId: new mongoose.Types.ObjectId(districtId)
        }).select(
            " id firstName middleName lastName email profileImg createdAt phone homeAddress mailingAddress pronoun gender role"
        );
        if (!admins) {
            return res.status(404).json({ message: "Admins not found." });
        }

        res.status(200).json({ data: admins });
    } catch (error) {
        console.error("Error fetching admin by ID:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};