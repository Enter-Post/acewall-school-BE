import mongoose from "mongoose";
import CourseSch from "../../Models/courses.model.sch.js";
import Semester from "../../Models/semester.model.js";

export const createSemester = async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const { districtId } = req.user
  try {
    const newSemester = new Semester({ title, startDate, endDate, districtId });
    await newSemester.save();
    res
      .status(201)
      .json({ message: "Semester created successfully", newSemester });
  } catch (error) {
    console.log("error in creating semester", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSemester = async (req, res) => {
  const { districtId } = req.user
  try {
    const semesters = await Semester.find({ districtId });
    res
      .status(200)
      .json({ message: "Semesters found successfully", semesters });
  } catch (error) {
    console.log("error in getting semester", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSemesterwithQuarter = async (req, res) => {
  const { districtId } = req.user
  try {
    const semesters = await Semester.aggregate([
      {
        $lookup: {
          from: "quarters", // collection name in lowercase plural form
          let: { semesterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$semester", "$$semesterId"] },
                    { $eq: ["$districtId", new mongoose.Types.ObjectId(districtId)] }
                  ]
                }
              }
            }
          ],
          as: "quarters",
        },
      },
      {
        $match: {
          districtId: new mongoose.Types.ObjectId(districtId)
        }
      },
      {
        $sort: { startDate: 1 }, // Optional: sort semesters chronologically
      },
    ]);

    res
      .status(200)
      .json({ message: "Semesters found successfullyy", semesters });
  } catch (error) {
    console.error("Error fetching semesters with quarters:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const selectingNewSemesterwithQuarter = async (req, res) => {
  const { semester, quarter } = req.body;
  const { courseId } = req.params;

  try {
    const course = await CourseSch.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const semesterResults =
      Array.isArray(course.semester) && Array.isArray(semester)
        ? semester.map((s) => ({
          id: s,
          status: course.semester.map(String).includes(String(s)),
        }))
        : [];

    const quarterResults =
      Array.isArray(course.quarter) && Array.isArray(quarter)
        ? quarter.map((q) => ({
          id: q,
          status: course.quarter.map(String).includes(String(q)),
        }))
        : [];

    semesterResults.forEach((s) => {
      if (s.status === false) {
        course.semester.push(s.id);
      }
    });

    quarterResults.forEach((q) => {
      if (q.status === false) {
        course.quarter.push(q.id);
      }
    });

    await course.save(); // ✅ Now it persists to MongoDB

    return res.status(200).json({
      message: "Semester and Quarter updated successfully",
    });
  } catch (error) {
    console.log("error in SelectingNewSemesterwithQuarter", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
