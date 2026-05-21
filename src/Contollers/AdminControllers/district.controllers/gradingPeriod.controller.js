import Quarter from "../../../Models/quarter.model.js";
import Semester from "../../../Models/semester.model.js";
import mongoose from "mongoose";

export const createSemester = async (req, res) => {
    const { title, startDate, endDate } = req.body;
    const { districtId } = req.user
    try {

        if (req.user.role !== "district_admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (!title || !startDate || !endDate) {
            return res.status(400).json({ message: "All fields are required" });
        }

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

export const getSemesterwithQuarter = async (req, res) => {
    const { districtId } = req.user
    try {

        if (req.user.role !== "district_admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

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

export const createQuarter = async (req, res) => {
    const { title, startDate, endDate, semester } = req.body;
    const { districtId } = req.user;
    try {

        if (req.user.role !== "district_admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const newQuarter = new Quarter({
            title,
            startDate,
            endDate,
            semester,
            districtId,
        });
        await newQuarter.save();
        res
            .status(201)
            .json({ message: "Quarter created successfully", newQuarter });
    } catch (error) {
        console.log("error in creating quarter", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const archivedQuarter = async (req, res) => {
  const { quarterId } = req.params;
  const { isArchived } = req.body;
  const { districtId } = req.user;

  try {
    const updatedQuarter = await Quarter.findOneAndUpdate(
      { _id: quarterId, districtId },
      { isArchived },
      { new: true }
    );

    if (!updatedQuarter) {
      return res.status(404).json({ message: "Quarter not found" });
    }

    res.status(200).json({
      message: "Quarter archived successfully",
      updatedQuarter,
    });
  } catch (error) {
    console.log("error in archiving quarter", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const archivedSemester = async (req, res) => {
  const { isArchived } = req.body;
  const { semesterId } = req.params;
  try {
    const semesters = await Semester.findByIdAndUpdate(
      semesterId,
      {
        isArchived,
      },
      {
        new: true,
      }
    );
    res
      .status(200)
      .json({ message: "Semesters found successfully", semesters });
  } catch (error) {
    console.log("error in getting semester", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editSemester = async (req, res) => {
  const { semesterId } = req.params;
  const { title, startDate, endDate } = req.body;

  try {
    // Check for another semester in the same course with the same title (case-insensitive)
    const existingSemester = await Semester.findOne({
      _id: { $ne: semesterId }, // exclude the one being edited
      title: { $regex: new RegExp(`^${title}$`, "i") }, // case-insensitive match
    });

    if (existingSemester) {
      return res.status(400).json({
        success: false,
        message: "Another semester with the same title already exists in this course."
      });
    }

    // Update semester
    const updatedSemester = await Semester.findByIdAndUpdate(
      semesterId,
      { title, startDate, endDate },
      { new: true }
    );

    if (!updatedSemester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    res.status(200).json({
      message: "Semester updated successfully",
      updatedSemester
    });

  } catch (error) {
    console.log("error in editing semester", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const editQuarter = async (req, res) => {
  const { quarterId } = req.params;
  const { title, startDate, endDate, semester } = req.body;

  try {
    // 1️⃣ Check if semester exists
    const semesterDoc = await Semester.findById(semester);
    if (!semesterDoc) {
      return res.status(404).json({ success: false, message: "Semester not found" });
    }

    // 2️⃣ Validate quarter dates are within semester dates
    if (new Date(startDate) < new Date(semesterDoc.startDate) ||
      new Date(endDate) > new Date(semesterDoc.endDate)) {
      return res.status(400).json({
        success: false,
        message: `Quarter dates must be between ${semesterDoc.startDate.toDateString()} and ${semesterDoc.endDate.toDateString()}`
      });
    }

    // 3️⃣ Check if another quarter with same title exists in the semester (case-insensitive)
    const existing = await Quarter.findOne({
      _id: { $ne: quarterId },
      title: { $regex: new RegExp(`^${title}$`, "i") },
      semester
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Another quarter with the same title already exists in this semester."
      });
    }

    // 4️⃣ Update the quarter
    const updatedQuarter = await Quarter.findByIdAndUpdate(
      quarterId,
      { title, startDate, endDate, semester },
      { new: true }
    );

    if (!updatedQuarter) {
      return res.status(404).json({ success: false, message: "Quarter not found" });
    }

    res.status(200).json({
      success: true,
      message: "Quarter edited successfully",
      updatedQuarter
    });

  } catch (error) {
    console.error("Error editing quarter", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};