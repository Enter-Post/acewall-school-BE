import CourseSch from "../../Models/courses.model.sch.js";

export const getCoursesByTeacherSch_WEB = async (req, res) => {
  const teacherId = req.user._id;
  const search = req.query.search?.trim();

  const { published } = req.query;

  try {
    // Construct filter based on teacherId and search query
    const query = {
      createdby: teacherId,
      published: published,
    };

    if (search) {
      query["courseTitle"] = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Find courses based on teacherId and optional search
    const courses = await CourseSch.find(query)
      .populate({
        path: "createdby",
        select: "firstName middleName lastName profileImg", // Select relevant fields for teacher
      })
      .populate({
        path: "category",
        select: "title", // Select relevant fields for category
      });

    if (!courses || courses.length === 0) {
      return res
        .status(200)
        .json({ courses: [], message: "No courses found for this teacher" });
    }

    res.status(200).json({ courses, message: "Courses fetched successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCoursesSchupdated = async (req, res) => {
  try {
    const { search, published, page = 1, limit = 6 } = req.query;

    const match = {};

    if (search) {
      match.courseTitle = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courseQuery = { ...match };
    if (published !== undefined) {
      courseQuery.published = published;
    }

    const [totalCourses, courses] = await Promise.all([
      CourseSch.countDocuments(courseQuery),
      CourseSch.find(courseQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate(
          "createdby",
          "firstName middleName lastName Bio email profileImg"
        )
        .populate("category", "title")
        .populate("subcategory", "name"),
    ]);

    res.status(200).json({
      courses, // contains only the current page's courses
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCourses / limit),
      totalCourses, // ✅ total count of all courses
      message: courses.length
        ? "Courses fetched successfully"
        : "No courses found",
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: error.message });
  }
};
