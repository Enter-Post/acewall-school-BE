import User from "../Models/user.model.js"

export const getGuardianEmailPreferences = async (req, res) => {
    const { studentId } = req.params;

    console.log("this api is working")

    try {
        const user = await User.findById(studentId).select("guardianEmailPreferences");

        if (!user) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({
            message: "Guardian email preferences fetched successfully",
            preferences: user.guardianEmailPreferences,
        });
    } catch (error) {
        console.error("Error fetching guardian preferences:", error);
        res.status(500).json({ message: "Error fetching guardian preferences", error: error.message });
    }
};

export const updateGuardianEmailPreferences = async (req, res) => {
    const { studentId } = req.params;
    const { guardianEmailPreferences } = req.body;

    try {
        const user = await User.findById(studentId);
        if (!user) {
            return res.status(404).json({ message: "Student not found" });
        }

        // merge updates safely
        user.guardianEmailPreferences = {
            ...user.guardianEmailPreferences,
            ...guardianEmailPreferences,
        };

        await user.save();

        res.status(200).json({
            message: "Guardian email preferences updated successfully",
            preferences: user.guardianEmailPreferences,
        });
    } catch (error) {
        console.error("Error updating guardian preferences:", error);
        res.status(500).json({ message: "Error updating guardian preferences", error: error.message });
    }
};