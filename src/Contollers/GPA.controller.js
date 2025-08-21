import GPA from "../Models/GPA.model.js"

export const setGPAscale = async (req, res) => {
    const { gpaScale } = req.body;

    if (!Array.isArray(gpaScale) || gpaScale.length === 0) {
        return res.status(400).json({ error: "Scale must be a non-empty array." });
    }

    try {
        const existing = await GPA.findOne();

        if (existing) {
            await GPA.findOneAndUpdate({ _id: existing._id }, { gpaScale });

            return res.status(200).json({
                message: "Grading scale updated successfully",
            });
        }

        const newGrade = await GPA.create({ gpaScale });

        res.status(200).json({
            message: "Grading scale saved successfully",
            //   grade: newGrade.grade,
        });
    } catch (err) {
        console.error("Error saving GPA:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getGPAScale = async (req, res) => {
    try {
        const GPADoc = await GPA.findOne();

        console.log(GPADoc, "GPADoc");

        const grade = GPADoc?.gpaScale
            ? [...GPADoc.gpaScale].sort((a, b) => b.maxPercentage - a.maxPercentage)
            : null;

        console.log(grade, "grade");
        if (!grade) {
            return res.status(404).json({ message: "Grading scale not found" });
        }
        return res.status(201).json({ message: "Grading scale found", grade });
    } catch (err) {
        console.error("Error fetching grading scale:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};