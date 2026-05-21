import GPA from "../Models/GPA.model.js"

export const getGPAScale = async (req, res) => {
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