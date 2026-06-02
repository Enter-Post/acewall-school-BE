import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../../Models/user.model.js";

export const adminForgetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const isExist = await User.findOne({ email });

        if (!isExist) {
            return res.status(404).json({
                message: "User with this email does not exist",
            });
        }

        const resetToken = jwt.sign(
            { email, purpose: "password_reset" },
            process.env.JWT_SECRAT,
            { expiresIn: "15m" }
        );

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for 587
            auth: {
                user: "support@acewallscholars.org",
                pass: "bwcmdhpgjffsyjoy",
            },
        });

        await transporter.sendMail({
            from: `"Acewall Scholars Support" <support@acewallscholars.org>`,
            to: email,
            subject: "Admin Password Reset Request",
            html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; padding: 20px; background: #ffffff;">
        <img src="https://lirp.cdn-website.com/6602115c/dms3rep/multi/opt/acewall+scholars-431w.png" 
             alt="Acewall Scholars Logo" 
             style="height: 60px; margin: 0 auto;" />
      </div>
      <div style="background: #28a745; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Reset Your Admin Password</h1>
      </div>
      <div style="padding: 20px; color: #333; text-align: center;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">We received a request to reset your admin password. Click the button below to choose a new password:</p>
        <a href="${resetLink}" style="display: inline-block; margin-top: 20px; padding: 14px 30px; background: #28a745; color: #fff; font-size: 16px; font-weight: bold; border-radius: 6px; text-decoration: none;">Verify and Reset Password</a>
        <p style="font-size: 14px; margin-top: 20px;">This link will expire in <strong>15 minutes</strong>.</p>
      </div>
      <div style="background: #f0f4f8; color: #555; text-align: center; padding: 15px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
  </div>
  `,
        });

        return res.status(200).json({
            message: "Password reset link sent successfully to your email",
        });
    } catch (err) {
        console.log("error in adminForgetPassword", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export const adminResetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Reset token is required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRAT);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        if (decoded.purpose !== "password_reset") {
            return res.status(400).json({ message: "Invalid token type" });
        }

        const email = decoded.email;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.updateOne({ email }, { password: hashedPassword });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Update password error:", error.message);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
