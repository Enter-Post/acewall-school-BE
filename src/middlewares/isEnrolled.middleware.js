import Enrollment from "../Models/Enrollement.model.js";

export const isEnrolledMiddleware = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // ✅ ADMIN BYPASS (adjust role check if needed)
    if (req.user.role === "admin" || req.user.isAdmin === true) {
      return next();
    }

    const exists = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!exists) {
      return res.status(403).json({
        message: "You are not enrolled in this course",
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
