import mongoose from "mongoose";
import Quarter from "../../Models/quarter.model.js";
import Semester from "../../Models/semester.model.js";

export const createQuarter = async (req, res) => {
  const { title, startDate, endDate, semester } = req.body;
  const { districtId } = req.user;
  try {
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

export const getQuarter = async (req, res) => {
  const { districtId } = req.user;

  try {
    const quarters = await Quarter.find({ districtId });
    res.status(200).json({ message: "Quarters found successfully", quarters });
  } catch (error) {
    console.log("error in the getting quarter", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getQuartersofSemester = async (req, res) => {
  const { semesters } = req.body;
  const { districtId } = req.user;

  try {
    const quarters = await Quarter.find({ semester: { $in: semesters }, districtId }).populate('semester');
    console.log("quarters", quarters);
    res.status(200).json({ message: "Quarters found successfully", quarters });
  } catch (error) {
    console.log("error in the getting quarter", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSemesterQuarter = async (req, res) => {
  const { semesterId } = req.params;
  const { districtId } = req.user;

  await Quarter.find({ semester: semesterId, districtId })
    .then((quarters) => {
      res
        .status(200)
        .json({ message: "Quarters found successfully", quarters });
    })
    .catch((error) => {
      console.log("error in getting quarters for semester", error);
      res.status(500).json({ message: "Internal Server Error" });
    });
};

export const getDatesofQuarter = async (req, res) => {
  const { quarterId } = req.params;
  const { districtId, } = req.user;

  try {
    const quarter = await Quarter.findOne({ _id: quarterId, districtId, });

    if (!quarter) {
      return res.status(404).json({ message: "Quarter not found" });
    }

    res.status(200).json({
      message: "Dates found successfully",
      startDate: quarter.startDate,
      endDate: quarter.endDate,
    })
  } catch (error) {
    console.log(error, "error in getting dates of quarter");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getQuartersofSemester_Updated = async (req, res) => {
  const { semesters } = req.body;
  const { districtId } = req.user;

  try {
    // Ensure ObjectId conversion
    const semesterIds = semesters.map(id => new mongoose.Types.ObjectId(id));

    const quarters = await Quarter.aggregate([
      {
        $match: {
          semester: { $in: semesterIds },
          districtId: new mongoose.Types.ObjectId(districtId),
        }
      },
      {
        $group: {
          _id: "$semester",
          quarters: { $push: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "semesters", // make sure this is the actual collection name
          localField: "_id",
          foreignField: "_id",
          as: "semester"
        }
      },
      { $unwind: "$semester" },
      { $sort: { "semester.name": 1 } }
    ]);

    res.status(200).json({
      message: "Quarters grouped by semester",
      data: quarters
    });
  } catch (error) {
    console.log("error in getting quarters", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

