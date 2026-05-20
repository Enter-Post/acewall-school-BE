import StandardGrading from "../Models/StandardGrading.model.js";

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