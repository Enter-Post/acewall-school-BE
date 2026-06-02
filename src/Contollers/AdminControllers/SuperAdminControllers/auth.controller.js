import bcrypt from "bcrypt";
import User from "../../../Models/user.model.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const updatePassword = async (req, res) => {
    const user = req.user;
    const userId = req.params.id;
    const { password } = req.body;
    const schoolId = req.query.schoolId;
    const districtId = req.query.districtId;

    try {
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const hashedPassword = await bcrypt.hash(password, 11);

        const query = { _id: userId };

        if (districtId && districtId !== 'null') query.districtId = districtId;
        if (schoolId && schoolId !== 'null') query.schoolId = schoolId;

        const updatedUser = await User.findOneAndUpdate(
            query,
            { password: hashedPassword },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or you don't have permission" });
        }

        res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}