import mongoose from "mongoose";
import CourseSch from "../../../../Models/courses.model.sch.js";


export const getCoursesOfteacher = async (req, res) => {
    const { teacherId, schoolId } = req.params;
    const { search, page = 1, limit = 10 } = req.query;
    // const { districtId } = req.user
    let districtId;
    const user = req.user

    try {

        if (user.role == "super_admin") {
            districtId = req.query.districtId
        } else if (user.role == "district_admin") {
            districtId = user.districtId
        }

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

        if (req.user.role !== "district_admin") {
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
                $addFields: {
                    semesterCount: { $size: "$semester" },
                    quarterCount: { $size: "$quarter" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdby",
                    foreignField: "_id",
                    as: "createdby",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                profileImg: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$createdby",
                    preserveNullAndEmptyArrays: true,
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
                                    $eq: ["$course", "$$courseId"],
                                },
                            },
                        },
                    ],
                    as: "assessmentsCount",
                },
            },
            {
                $addFields: {
                    assessmentsCount: { $size: "$assessmentsCount" },
                },
            },
            {
                $lookup: {
                    from: "enrollments",
                    localField: "_id",
                    foreignField: "course",
                    as: "enrollmentsCount",
                },
            },
            {
                $addFields: {
                    enrollmentsCount: { $size: "$enrollmentsCount" },
                },
            },
            {
                $lookup: {
                    from: "chapters",
                    localField: "_id",
                    foreignField: "course",
                    as: "chapterCount",
                },
            },
            {
                $addFields: {
                    chapterCount: { $size: "$chapterCount" },
                },
            },
            {
                $lookup: {
                    from: "lessons",
                    localField: "_id",
                    foreignField: "course",
                    as: "lessonsCount",
                },
            },
            {
                $addFields: {
                    lessonsCount: { $size: "$lessonsCount" },
                },
            },
            {
                $lookup: {
                    from: "discussions",
                    localField: "_id",
                    foreignField: "course",
                    as: "discussionsCount",
                },
            },
            {
                $addFields: {
                    discussionsCount: { $size: "$discussionsCount" },
                },
            },

            {
                $lookup: {
                    from: "pages",
                    localField: "_id",
                    foreignField: "course",
                    as: "pagesCount",
                },
            },
            {
                $addFields: {
                    pagesCount: { $size: "$pagesCount" },
                },
            },

            {
                $lookup: {
                    from: "ratings",
                    localField: "_id",
                    foreignField: "course",
                    as: "ratingsCount",
                },
            },
            {
                $addFields: {
                    ratingsCount: { $size: "$ratingsCount" },
                    starRating: { $avg: "$ratingsCount.star" }
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

export const getCourseHierarchy = async (req, res) => {
    const { courseId } = req.params;
    const { districtId } = req.user;

    try {
        if (!courseId || !districtId) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        const hierarchy = await CourseSch.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(courseId),
                    districtId: new mongoose.Types.ObjectId(districtId),
                    isDeleted: false
                }
            },
            {
                $addFields: {
                    courseSemesterIds: {
                        $map: {
                            input: { $ifNull: ["$semester", []] },
                            as: "s",
                            in: {
                                $convert: {
                                    input: { $cond: [{ $isNumber: "$$s" }, "$$s", { $ifNull: ["$$s._id", "$$s"] }] },
                                    to: "objectId",
                                    onError: { $cond: [{ $isNumber: "$$s" }, "$$s", { $ifNull: ["$$s._id", "$$s"] }] },
                                    onNull: { $cond: [{ $isNumber: "$$s" }, "$$s", { $ifNull: ["$$s._id", "$$s"] }] }
                                }
                            }
                        }
                    },
                    courseQuarterIds: {
                        $map: {
                            input: { $ifNull: ["$quarter", []] },
                            as: "q",
                            in: {
                                $convert: {
                                    input: { $cond: [{ $isNumber: "$$q" }, "$$q", { $ifNull: ["$$q._id", "$$q"] }] },
                                    to: "objectId",
                                    onError: { $cond: [{ $isNumber: "$$q" }, "$$q", { $ifNull: ["$$q._id", "$$q"] }] },
                                    onNull: { $cond: [{ $isNumber: "$$q" }, "$$q", { $ifNull: ["$$q._id", "$$q"] }] }
                                }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "semesters",
                    let: { semesterIds: "$courseSemesterIds" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ["$_id", "$$semesterIds"] },
                                        { $eq: ["$isDeleted", false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "semesters"
                }
            },
            { $unwind: { path: "$semesters", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "quarters",
                    let: { semesterId: "$semesters._id", allowedQuarterIds: "$courseQuarterIds" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ["$_id", "$$allowedQuarterIds"] },
                                        { $eq: ["$semester", "$$semesterId"] },
                                        { $eq: ["$isDeleted", false] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "chapters",
                                let: { quarterId: "$_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$quarter", "$$quarterId"] },
                                                    { $eq: ["$course", new mongoose.Types.ObjectId(courseId)] },
                                                    { $eq: ["$isDeleted", false] }
                                                ]
                                            }
                                        }
                                    },
                                    // Chapter Assessments
                                    {
                                        $lookup: {
                                            from: "assessments",
                                            let: { chapterId: "$_id" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$chapter", "$$chapterId"] },
                                                                { $eq: ["$type", "chapter-assessment"] },
                                                                { $eq: ["$isDeleted", false] }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "assessments"
                                        }
                                    },
                                    // Chapter Discussions
                                    {
                                        $lookup: {
                                            from: "discussions",
                                            let: { chapterId: "$_id" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$chapter", "$$chapterId"] },
                                                                { $eq: ["$type", "chapter"] },
                                                                { $eq: ["$isDeleted", false] }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "discussions"
                                        }
                                    },
                                    // Chapter Pages
                                    {
                                        $lookup: {
                                            from: "pages",
                                            let: { chapterId: "$_id" },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ["$chapter", "$$chapterId"] },
                                                                { $eq: ["$type", "chapter"] },
                                                                { $eq: ["$isDeleted", false] }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "pages"
                                        }
                                    },
                                    // Lessons
                                    {
                                        $lookup: {
                                            from: "lessons",
                                            localField: "_id",
                                            foreignField: "chapter",
                                            as: "lessons",
                                            pipeline: [
                                                { $match: { isDeleted: false } },
                                                // Lesson Assessments
                                                {
                                                    $lookup: {
                                                        from: "assessments",
                                                        let: { lessonId: "$_id" },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            { $eq: ["$lesson", "$$lessonId"] },
                                                                            { $eq: ["$type", "lesson-assessment"] },
                                                                            { $eq: ["$isDeleted", false] }
                                                                        ]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        as: "assessments"
                                                    }
                                                },
                                                // Lesson Discussions
                                                {
                                                    $lookup: {
                                                        from: "discussions",
                                                        let: { lessonId: "$_id" },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            { $eq: ["$lesson", "$$lessonId"] },
                                                                            { $eq: ["$type", "lesson"] },
                                                                            { $eq: ["$isDeleted", false] }
                                                                        ]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        as: "discussions"
                                                    }
                                                },
                                                // Lesson Pages
                                                {
                                                    $lookup: {
                                                        from: "pages",
                                                        let: { lessonId: "$_id" },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $expr: {
                                                                        $and: [
                                                                            { $eq: ["$lesson", "$$lessonId"] },
                                                                            { $eq: ["$type", "lesson"] },
                                                                            { $eq: ["$isDeleted", false] }
                                                                        ]
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        as: "pages"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ],
                                as: "chapters"
                            }
                        }
                    ],
                    as: "semesters.quarters"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    courseTitle: { $first: "$courseTitle" },
                    semesters: { $push: "$semesters" }
                }
            }
        ]);

        if (!hierarchy || hierarchy.length === 0) {
            return res.status(404).json({ message: "Course hierarchy not found" });
        }

        res.status(200).json({
            message: "Course hierarchy fetched successfully",
            hierarchy: hierarchy[0]
        });
    } catch (error) {
        console.error("Error in getCourseHierarchy:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};