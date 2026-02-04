import PacingChart from "../Models/PacingChart.model.js";
import CourseSch from "../Models/courses.model.sch.js";
import Enrollment from "../Models/Enrollement.model.js";

// Create Pacing Chart (Admin Only)
export const createPacingChart = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Admin access only" });
    }

    const { courseId, items } = req.body;
    const userId = req.user._id;

    // Check if course exists
    const course = await CourseSch.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Check if pacing chart already exists for this course
    const existingChart = await PacingChart.findOne({ course: courseId });
    if (existingChart) {
      return res.status(400).json({
        success: false,
        message:
          "Pacing chart already exists for this course. Use update instead.",
      });
    }

    const newChart = new PacingChart({
      course: courseId,
      items,
      createdby: userId,
    });

    await newChart.save();

    res.status(201).json({
      success: true,
      message: "Pacing chart created successfully",
      data: newChart,
    });
  } catch (error) {
    console.error("Error creating pacing chart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Pacing Chart by Course ID
export const getPacingChartByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Authorization check
    const courseData = await CourseSch.findById(courseId);
    if (!courseData) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const isCreated = courseData.createdby.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";
    const isEnrolled = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!isCreated && !isAdmin && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this course's pacing chart",
      });
    }

    const pacingChart = await PacingChart.findOne({ course: courseId })
      .populate("course", "courseTitle")
      .populate("createdby", "firstName lastName");

    if (!pacingChart) {
      return res.status(200).json({
        success: true,
        message: "No pacing chart found for this course",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: pacingChart,
    });
  } catch (error) {
    console.error("Error fetching pacing chart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Pacing Chart (Admin Only)
export const updatePacingChart = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Admin access only" });
    }

    const { courseId } = req.params;
    const { items } = req.body;

    const updatedChart = await PacingChart.findOneAndUpdate(
      { course: courseId },
      { items },
      { new: true, runValidators: true },
    );

    if (!updatedChart) {
      return res.status(404).json({
        success: false,
        message: "Pacing chart not found for this course",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pacing chart updated successfully",
      data: updatedChart,
    });
  } catch (error) {
    console.error("Error updating pacing chart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Delete Pacing Chart (Admin Only)
export const deletePacingChart = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Admin access only" });
    }

    const { courseId } = req.params;

    const deletedChart = await PacingChart.findOneAndDelete({
      course: courseId,
    });

    if (!deletedChart) {
      return res.status(404).json({
        success: false,
        message: "Pacing chart not found for this course",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pacing chart deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pacing chart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
