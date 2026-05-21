import GPA from "../../../Models/GPA.model.js";
import GradingScale from "../../../Models/grading-scale.model.js";
import Semester from "../../../Models/semester.model.js";
import StandardGrading from "../../../Models/StandardGrading.model.js";


// normal grades

export const setGradingScale = async (req, res) => {
    const { scale } = req.body;
    const { districtId } = req.user;

    if (!Array.isArray(scale) || scale.length === 0) {
        return res.status(400).json({ error: "Scale must be a non-empty array." });
    }

    try {
        const existing = await GradingScale.findOne({ districtId });

        if (existing) {
            await GradingScale.findOneAndUpdate({ _id: existing._id }, { scale });

            return res.status(200).json({
                message: "Grading scale updated successfully",
                scale,
            });
        }

        const newScale = await GradingScale.create({ scale, districtId });

        res.status(200).json({
            message: "Grading scale saved successfully",
            scale: newScale.scale,
        });
    } catch (err) {
        console.error("Error saving grading scale:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGradingScale = async (req, res) => {
    const { districtId } = req.user;
    try {
        const scaleDoc = await GradingScale.findOne({ districtId });
        const scale = scaleDoc?.scale
            ? [...scaleDoc.scale].sort((a, b) => b.max - a.max)
            : null;
        if (!scale) {
            return res.status(404).json({ message: "Grading scale not found" });
        }
        return res.status(201).json({ message: "Grading scale found", scale });
    } catch (err) {
        console.error("Error fetching grading scale:", err);
        return null;
    }
};

// standard grades

export const setStandardGradingScale = async (req, res) => {
    const { districtId } = req.user
    const { scale } = req.body;

    if (!Array.isArray(scale) || scale.length === 0) {
        return res.status(400).json({ error: "Scale must be a non-empty array." });
    }
    try {
        const existing = await StandardGrading.findOne();

        if (existing) {
            await StandardGrading.findOneAndUpdate({ _id: existing._id }, { scale });

            return res.status(200).json({
                message: "Standard Grading scale updated successfully",
                scale,
            });
        }

        const newScale = await StandardGrading.create({ scale, districtId });

        res.status(200).json({
            message: "Standard Grading scale saved successfully",
            scale: newScale.scale,
        });
    } catch (error) {
        console.log("Error fetching standard grading scale:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const getStandardGradingScale = async (req, res) => {
    const { districtId } = req.user
    try {
        const scaleDoc = await StandardGrading.findOne({ districtId });
        const scale = scaleDoc?.scale
            ? [...scaleDoc.scale].sort((a, b) => b.max - a.max)
            : null;
        if (!scale) {
            return res.status(404).json({ message: "Standard Grading scale not found" });
        }
        return res.status(201).json({ message: "Standard Grading scale found", scale });
    } catch (err) {
        console.error("Error fetching grading scale:", err);
        return null;
    }
};

// gpa

export const setGpa = async (req, res) => {
    const { districtId } = req.user
    const { gpaScale } = req.body;

    if (!Array.isArray(gpaScale) || gpaScale.length === 0) {
        return res.status(400).json({ error: "Scale must be a non-empty array." });
    }

    try {
        const existing = await GPA.findOne({ districtId });

        if (existing) {
            await GPA.findOneAndUpdate({ _id: existing._id, districtId }, { gpaScale });

            return res.status(200).json({
                message: "Grading scale updated successfully",
            });
        }

        await GPA.create({ gpaScale, districtId });

        res.status(200).json({
            message: "Grading scale saved successfully",
        });
    } catch (err) {
        console.error("Error saving GPA:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGpa = async (req, res) => {
    const { districtId } = req.user
    try {
        const GPADoc = await GPA.findOne({ districtId });

        const grade = GPADoc?.gpaScale
            ? [...GPADoc.gpaScale].sort((a, b) => b.maxPercentage - a.maxPercentage)
            : null;

        if (!grade) {
            return res.status(404).json({ message: "Grading scale not found" });
        }
        return res.status(201).json({ message: "Grading scale found", grade });
    } catch (err) {
        console.error("Error fetching grading scale:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
