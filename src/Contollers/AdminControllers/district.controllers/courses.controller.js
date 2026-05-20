import mongoose from "mongoose";
import CourseSch from "../../../Models/courses.model.sch.js";

export const getCoursesOfteacher = async (req, res) => {
    const { teacherId, schoolId } = req.params;
    const { search, page = 1, limit = 10 } = req.query;
    const { districtId } = req.user

    try {
        const query = {
            $and: [
                { createdby: teacherId, districtId, schoolId },
                search
                    ? { "basics.courseTitle": { $regex: search, $options: "i" } }
                    : {},
            ],
        };

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [courses, total] = await Promise.all([
            CourseSch.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("createdby")
                .populate("category"),
            CourseSch.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum);

        if (!courses || courses.length === 0) {
            return res
                .status(200)
                .json({
                    courses: [],
                    message: "No courses found for this teacher",
                    pagination: {
                        currentPage: pageNum,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limitNum
                    }
                });
        }

        res.status(200).json({
            courses,
            message: "Courses fetched successfully",
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourseDetails = async (req, res) => {
    const { courseId, schoolId } = req.params;
    const userId = req.user._id;
    const { districtId } = req.user;
    try {

        if (!courseId || !schoolId || !districtId) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        if(req.user.role !== "district_admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const courseData = await CourseSch.findOne({ _id: courseId, districtId, schoolId });

        if (!courseData || courseData.isDeleted) {
            return res.status(404).json({ message: "Course not found" });
        }

        const course = await CourseSch.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(courseId), isDeleted: false, districtId: new mongoose.Types.ObjectId(districtId), schoolId: new mongoose.Types.ObjectId(schoolId) },
            },
            // Sort courses by creation date, latest first (assuming `createdAt` is the field for creation date)
            {
                $sort: { createdAt: -1 }, // Use -1 for descending order
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subcategory",
                    foreignField: "_id",
                    as: "subcategory",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$subcategory",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "semesters",
                    localField: "semester",
                    foreignField: "_id",
                    as: "semester",
                    pipeline: [
                        {
                            $match: { isArchived: false },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "quarters",
                    localField: "quarter",
                    foreignField: "_id",
                    as: "quarter",
                    pipeline: [
                        {
                            $match: { isArchived: false },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "assessments",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$course", "$$courseId"] },
                                        { $eq: ["$type", "Course-assessment"] },
                                    ],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: "assessmentcategories",
                                localField: "category",
                                foreignField: "_id",
                                as: "category",
                            },
                        },
                        {
                            $unwind: {
                                path: "$category",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                    ],
                    as: "CourseAssessments",
                },
            },
            {
                $lookup: {
                    from: "enrollments",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: ["$course", "$$courseId"] } },
                        },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: "enrollmentsCount",
                },
            },
        ]);

        if (!course || course.length === 0) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({
            message: "Course fetched successfully",
            course: course[0],
        });
    } catch (error) {
        console.error("error in getCourseHierarchy", error);
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};