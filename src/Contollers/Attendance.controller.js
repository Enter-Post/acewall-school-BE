import Attendance from "../Models/Attendance.model.js"; // Don't forget to import the model!
import mongoose from "mongoose";
export const saveAttendance = async (req, res) => {
  const { districtId, schoolId } = req.user
  try {
    const { courseId, date, records } = req.body;

    const providedDate = new Date(date);
    providedDate.setUTCHours(0, 0, 0, 0);

    const bulkOps = Object.entries(records).map(([studentId, data]) => {

      // Ensure we extract status and note correctly from the object
      const status = typeof data === 'object' ? data.status : data;
      const note = typeof data === 'object' ? data.note : "";

      return {
        updateOne: {
          filter: {
            course: courseId,
            student: studentId,
            date: providedDate,
            districtId,
            schoolId,
          },
          update: {
            $set: {
              status: status || "not marked",
              note: note,
              markedBy: req.user._id,
              updatedAt: new Date()
            }
          },
          upsert: true,
        },
      };
    });

    if (bulkOps.length === 0) {
      return res.status(400).json({ success: false, message: "No records provided" });
    }

    await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Attendance saved for ${providedDate.toISOString().split('T')[0]}!`
    });
  } catch (error) {
    console.error("BulkWrite Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



export const getAttendanceByDate = async (req, res) => {
  try {
    const { courseId, date } = req.params;
    const { districtId, schoolId } = req.user
    // Normalize the date to midnight to match the stored records
    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const records = await Attendance.find({
      course: courseId,
      date: searchDate,
      isDeleted: false,
      districtId,
      schoolId
    });

    // Transform array into an object: { studentId: status }
    const attendanceMap = {};
    records.forEach((rec) => {
      attendanceMap[rec.student.toString()] = {
        status: rec.status,
        note: rec.note || "",
      };
    });

    res.status(200).json({
      success: true,
      attendance: attendanceMap,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// attendance.controller.js

export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { districtId, schoolId } = req.user

    const attendance = await Attendance.find({ student: studentId, isDeleted: false, districtId, schoolId })
      .populate({
        path: "course",
        // 🔹 Added thumbnail here
        select: "courseTitle thumbnail",
        populate: {
          path: "createdby",
          // 🔹 Added profileImg here
          select: "firstName lastName profileImg"
        }
      })
      .sort({ date: -1 });

    // We send back 'attendance'
    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// attendance.controller.js
export const updateAttendanceNote = async (req, res) => {
  try {
    const { attendanceId, note } = req.body;
    const studentId = req.user._id;
    const { districtId, schoolId } = req.user

    const updatedRecord = await Attendance.findOneAndUpdate(
      { _id: attendanceId, student: studentId, districtId, schoolId }, // Ensure only the student who owns the record can add a note
      { note },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, record: updatedRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// attendance.controller.js

export const getAdminMonthlyAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { month, year } = req.query; // e.g., month=1, year=2024
    const { districtId, schoolId } = req.user

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required." });
    }

    // 1. Create date range for the month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // 2. Aggregate attendance records
    const monthlyData = await Attendance.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          date: { $gte: startDate, $lte: endDate },
          districtId: new mongoose.Types.ObjectId(districtId),
          schoolId: new mongoose.Types.ObjectId(schoolId),
        },
      },
      // Join with User info to get student names
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: "$studentInfo" },
      // Group by student to collect all their dates in one array
      {
        $group: {
          _id: "$student",
          name: { $first: { $concat: ["$studentInfo.firstName", " ", "$studentInfo.lastName"] } },
          email: { $first: "$studentInfo.email" },
          records: {
            $push: {
              date: "$date",
              status: "$status",
              note: "$note"
            },
          },
        },
      },
      { $sort: { name: 1 } }
    ]);

    res.status(200).json({
      success: true,
      month,
      year,
      data: monthlyData,
    });
  } catch (error) {
    console.error("Admin Monthly Fetch Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};