import mongoose from "mongoose";
import LoginActivity from "../Models/userActivity.model.js";

export const getLoginActivityofStudent = async (req, res) => {
  try {
    const { period } = req.query; // period = 30 | 60 | 90
    const { userId } = req.params;

    const days = parseInt(period, 10) || 30; // default last 30 days

    const endDate = new Date(); // today
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1); // last N days inclusive

    // Aggregate daily login counts
    const activity = await LoginActivity.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          loginAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$loginAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Fill missing dates with 0 for chart continuity
    const fullData = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const isoDate = d.toISOString().split("T")[0];

      const found = activity.find(a => a.date === isoDate);
      fullData.push({
        name: isoDate, // chart expects `name`
        a: found ? found.count : 0, // area value
        b: found ? found.count : 0, // line value (example same as area)
      });
    }

    res.status(200).json(fullData);
  } catch (error) {
    console.error("Login Activity Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
