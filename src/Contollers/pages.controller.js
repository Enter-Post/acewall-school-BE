import { uploadToCloudinary } from "../lib/cloudinary-course.config.js";
import Pages from "../Models/Pages.modal.js";
import CourseSch from "../Models/courses.model.sch.js";
import Enrollment from "../Models/Enrollement.model.js";

export const createpage = async (req, res) => {
    const { title, description, googleDriveImage, googleDrivePdf } = req.body;
    const { courseId, type, typeId } = req.params;
    const { districtId, schoolId } = req.user;

    if (!courseId) {
        return res.status(400).json({ message: "Course ID is required." });
    }

    const image = req.files?.image?.[0];
    const files = req.files?.files || [];

    try {
        // Handle local PDF files
        const uploadedFiles = await Promise.all(
            files.map(async (file) => {
                const result = await uploadToCloudinary(file.buffer, "discussion_files");
                return {
                    url: result.secure_url,
                    publicId: result.public_id,
                    type: file.mimetype,
                    filename: file.originalname,
                    source: 'local'
                };
            })
        );

        // Handle Google Drive PDF if present
        if (googleDrivePdf) {
            try {
                const drivePdf = JSON.parse(googleDrivePdf);
                uploadedFiles.push({
                    url: drivePdf.url,
                    publicId: drivePdf.publicId,
                    type: drivePdf.type || 'application/pdf',
                    filename: drivePdf.filename,
                    source: 'google_drive'
                });
            } catch (err) {
                console.error("Error parsing Google Drive PDF:", err);
            }
        }

        let imageData = null;

        // Handle local image
        if (image) {
            const result = await uploadToCloudinary(image.buffer, "page_images");
            imageData = {
                url: result.secure_url,
                publicId: result.public_id,
                filename: image.originalname,
                source: 'local'
            };
        }

        // Handle Google Drive image if present
        if (googleDriveImage) {
            try {
                const driveImage = JSON.parse(googleDriveImage);
                imageData = {
                    url: driveImage.url,
                    publicId: driveImage.publicId,
                    filename: driveImage.filename,
                    source: 'google_drive'
                };
            } catch (err) {
                console.error("Error parsing Google Drive image:", err);
            }
        }

        let newPage;

        if (type === "lesson") {
            newPage = new Pages({
                title,
                description,
                course: courseId,
                type,
                lesson: typeId,
                image: imageData,
                files: uploadedFiles,
                districtId,
                schoolId
            });

        } else if (type === "chapter") {
            newPage = new Pages({
                title,
                description,
                course: courseId,
                type,
                chapter: typeId,
                image: imageData,
                files: uploadedFiles,
                districtId,
                schoolId
            });

        }
        await newPage.save();

        res.status(201).json({
            message: "Page created successfully",
            page: newPage,
        });
    } catch (error) {
        console.error("Error creating page:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getAllPages = async (req, res) => {
    const { courseId, type, typeId } = req.params
    const { districtId, schoolId } = req.user;

    try {
        let pages;
        let query = { isDeleted: false, districtId, schoolId };

        if (type === "lesson") {
            query.lesson = typeId;
        } else if (type === "chapter") {
            query.chapter = typeId;
        } else if (type === "course") {
            query.course = courseId;
        } else {
            return res.status(400).json({
                message: "Invalid type. Must be 'lesson', 'chapter', or 'course'"
            });
        }

        pages = await Pages.find(query);

        if (!pages || pages.length === 0) {
            return res.status(200).json({
                pages: [],
                message: "No pages found for this " + type
            });
        }

        res.status(200).json({
            pages,
            message: "pages found successfully."
        })

    } catch (error) {
        console.error("Error fetching pages:", error);
        res.status(500).json({ message: "Failed to fetch pages", error: error.message });
    }
};



// DELETE a page by ID
export const deletePage = async (req, res) => {
    const { pageId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    try {
        // Authorization check: only teachers and admins can delete pages
        if (userRole !== "teacher" && userRole !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const page = await Pages.findById(pageId);
        if (!page) {
            return res.status(404).json({ message: "Page not found" });
        }

        // If teacher, verify they own the course
        if (userRole === "teacher") {
            const CourseSch = await import("../Models/courses.model.sch.js");
            const course = await CourseSch.default.findOne({ _id: page.course, createdby: userId });
            if (!course) {
                return res.status(403).json({ message: "You can only delete pages of your own courses" });
            }
        }

        // Soft delete page
        const deletedPage = await Pages.findByIdAndUpdate(pageId, {
            isDeleted: true,
            deletedAt: new Date()
        });

        res.status(200).json({ message: "Page deleted successfully", page: deletedPage });
    } catch (error) {
        console.error("Error deleting page:", error);
        res.status(500).json({ message: "Failed to delete page", error: error.message });
    }
};

export const getDeletedPages = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    try {
        // Authorization check: only teachers and admins can view deleted pages
        if (userRole !== "teacher" && userRole !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // If teacher, verify they own the course
        if (userRole === "teacher") {
            const CourseSch = await import("../Models/courses.model.sch.js");
            const course = await CourseSch.default.findOne({ _id: courseId, createdby: userId });
            if (!course) {
                return res.status(403).json({ message: "You can only view deleted pages of your own courses" });
            }
        }

        const deletedPages = await Pages.find({ course: courseId, isDeleted: true })
            .sort({ deletedAt: -1 })
            .populate("course", "courseTitle")
            .populate("chapter", "title")
            .populate("lesson", "title");

        res.status(200).json({
            message: "Deleted pages fetched successfully",
            count: deletedPages.length,
            deletedPages,
        });
    } catch (error) {
        console.error("Error fetching deleted pages:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const restorePage = async (req, res) => {
    const { pageId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    try {
        // Authorization check: only teachers and admins can restore pages
        if (userRole !== "teacher" && userRole !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const page = await Pages.findById(pageId);
        if (!page) {
            return res.status(404).json({ message: "Page not found" });
        }

        if (!page.isDeleted) {
            return res.status(400).json({ message: "Page is not deleted" });
        }

        // If teacher, verify they own the course
        if (userRole === "teacher") {
            const CourseSch = await import("../Models/courses.model.sch.js");
            const course = await CourseSch.default.findOne({ _id: page.course, createdby: userId });
            if (!course) {
                return res.status(403).json({ message: "You can only restore pages of your own courses" });
            }
        }

        // Restore page
        page.isDeleted = false;
        page.deletedAt = null;
        await page.save();

        res.status(200).json({ message: "Page restored successfully", page });
    } catch (error) {
        console.error("Error restoring page:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const getStudentPages = async (req, res) => {
    try {
        const studentId = req.user?.id || req.query.studentId;
        const courseId = req.query.courseId;
        const { districtId, schoolId } = req.user;

        if (!studentId) {
            return res.status(400).json({ message: "Student ID is required." });
        }

        // Step 1: Get enrolled course IDs
        const enrollments = await Enrollment.find({ student: studentId, districtId, schoolId }).select("course");

        if (enrollments.length === 0) {
            return res.status(404).json({ message: "Student is not enrolled in any courses." });
        }

        const enrolledCourseIds = enrollments.map((enroll) => enroll.course.toString());

        // Step 2: Filter logic
        let courseFilter;

        if (courseId && courseId !== "all") {
            // Only allow filtering if the course is in student's enrolled list
            if (!enrolledCourseIds.includes(courseId)) {
                return res.status(403).json({ message: "You are not enrolled in this course." });
            }
            courseFilter = { course: courseId };
        } else {
            // No specific course, show all enrolled
            courseFilter = { course: { $in: enrolledCourseIds } };
        }

        // Step 3: Fetch pages
        const pages = await Pages.find({ ...courseFilter, isDeleted: false, districtId, schoolId })
            .sort({ createdAt: -1 })
            .populate("course", "courseTitle");

        res.status(200).json({ pages });
    } catch (error) {
        console.error("Error fetching student pages:", error);
        res.status(500).json({ message: "Failed to fetch student pages", error: error.message });
    }
};

export const ChapterPagesforStudent = async (req, res) => {
    const { chapterId } = req.params
    const { districtId, schoolId } = req.user;
    try {
        const pages = await Pages.find({ chapter: chapterId, isDeleted: false, districtId, schoolId })

        if (!pages) {
            res.status(404).json({
                message: "no pages found"
            })
        }

        res.status(201).json({
            pages,
            message: "Pages found successfully"
        })
    } catch (error) {
        console.log("error in getting chapter for student", error)
        res.status(500).json({
            message: "Internal server Error"
        })
    }
}

export const lessonPagesforStudent = async (req, res) => {
    const { lessonId } = req.params
    const { districtId, schoolId } = req.user;

    try {
        const pages = await Pages.find({ lesson: lessonId, isDeleted: false, districtId, schoolId })

        if (!pages) {
            res.status(404).json({
                message: "no pages found"
            })
        }

        res.status(201).json({
            pages,
            message: "Pages found successfully"
        })
    } catch (error) {
        console.log("error in getting chapter for student", error)
        res.status(500).json({
            message: "Internal server Error"
        })
    }
}

