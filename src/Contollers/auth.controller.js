import User from "../Models/user.model.js";
import CourseSch from "../Models/courses.model.sch.js";
import { generateToken } from "../Utiles/jwtToken.js";
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../lib/cloudinary-course.config.js";
import nodemailer from "nodemailer";
import OTP from "../Models/opt.model.js";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import Enrollment from "../Models/Enrollement.model.js";
import mongoose from "mongoose";
import twilio from "twilio";

import multer from "multer";
import xlsx from "xlsx";
import OPT from "../Models/opt.model.js";

export const bulkSignup = async (req, res) => {
  try {
    const role = req.body.role;
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    console.log("Uploaded File:", req.file);

    // Read file from buffer instead of path
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const users = xlsx.utils.sheet_to_json(sheet);

    let created = [];
    let failed = [];

    for (let row of users) {
      try {
        const { firstName, middleName, lastName, email, phone, password } = row;

        if (!firstName || !lastName || !email || !phone || !password) {
          failed.push({
            email: email || "N/A",
            reason: "Missing required fields",
          });
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          failed.push({ email, reason: "Email already exists" });
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 11);

        const newUser = new User({
          firstName,
          middleName,
          lastName,
          role, // from admin's selection
          email,
          phone,
          password: hashedPassword,
        });

        await newUser.save();
        created.push(newUser.email);
      } catch (err) {
        failed.push({ email: row.email || "N/A", reason: err.message });
      }
    }

    return res.status(201).json({
      message: "Bulk upload completed.",
      createdCount: created.length,
      failedCount: failed.length,
      created,
      failed,
    });
  } catch (error) {
    console.error("Bulk Signup Error:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const initiateSignup = async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    // pronouns,
    // gender,
    role,
    email,
    phone,
    homeAddress,
    mailingAddress,
    password,
  } = req.body;

  try {
    if (!firstName || !lastName || !email || !password || !role || !phone) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }
    const hashedPassword = await bcrypt.hash(password, 11);
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const phoneNumUpdated = `+${phone.replace(/\D+/g, "")}`;

    await OTP.findOneAndUpdate(
      { email },
      {
        otp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          firstName,
          middleName,
          lastName,
          // pronoun: pronouns,
          // gender,
          role,
          email,
          phone: phoneNumUpdated,
          homeAddress,
          mailingAddress,
          password: hashedPassword,
        },
      },
      { upsert: true }
    );

    // Send OTP via email (or SMS)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });
    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: email,
      subject: "Your OTP Code",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Logo -->
      <div style="text-align: center; padding: 20px; background: #ffffff;">
        <img src="https://lirp.cdn-website.com/6602115c/dms3rep/multi/opt/acewall+scholars-431w.png" 
             alt="Acewall Scholars Logo" 
             style="height: 60px; margin: 0 auto;" />
      </div>

      <!-- Header -->
      <div style="background: #28a745; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">OTP Verification</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; text-align: center;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Your OTP code is:</p>
        
        <div style="margin: 20px auto; display: inline-block; padding: 15px 25px; background: #28a745; color: #fff; font-size: 24px; font-weight: bold; border-radius: 6px;">
          ${otp}
        </div>

        <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
      </div>

      <!-- Footer -->
      <div style="background: #f0f4f8; color: #555; text-align: center; padding: 15px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  </div>
  `,
    });

    res.status(201).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Signup initiation error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const SignupwithoutOTP = async (req, res) => {
  const { firstName, middleName, lastName, role, email, password } = req.body;

  try {
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 11);

    // Create new user
    const newUser = new User({
      firstName,
      middleName,
      lastName,
      role,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully.",
      user: newUser,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({
        message: "No OTP record found for this email. Please sign up again.",
      });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    otpRecord.otp = hashedOTP;
    otpRecord.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await otpRecord.save();

    // Resend email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });

    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: email,
      subject: "Your New OTP Code",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Logo -->
      <div style="text-align: center; padding: 20px; background: #ffffff;">
        <img src="https://lirp.cdn-website.com/6602115c/dms3rep/multi/opt/acewall+scholars-431w.png" 
             alt="Acewall Scholars Logo" 
             style="height: 60px; margin: 0 auto;" />
      </div>

      <!-- Header -->
      <div style="background: #28a745; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New OTP Code</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; text-align: center;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Here is your new OTP code:</p>
        
        <div style="margin: 20px auto; display: inline-block; padding: 15px 25px; background: #28a745; color: #fff; font-size: 24px; font-weight: bold; border-radius: 6px;">
          ${otp}
        </div>

        <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
      </div>

      <!-- Footer -->
      <div style="background: #f0f4f8; color: #555; text-align: center; padding: 15px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  </div>
  `,
    });

    res.status(200).json({ message: "New OTP has been sent to your email." });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_ACCOUNT_TOKEN
);

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email });
    if (!otpEntry)
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.otp);

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // ✅ mark email as verified in OTP entry
    otpEntry.isVerified = true;
    await otpEntry.save();

    // 📲 Generate phone OTP manually
    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const phoneOtp = generateOTP();

    const hashedOTP = await bcrypt.hash(phoneOtp, 10);

    // Save to DB with expiry (5 min)
    otpEntry.phoneOtp = hashedOTP;
    otpEntry.expiresAt = Date.now() + 10 * 60 * 1000;
    await otpEntry.save();

    const userData = otpEntry.userData;

    // 🚀 Send SMS using purchased number

    try {
      await twilioClient.messages.create({
        body: `Your Acewall Scholars phone verification code is: ${phoneOtp}`,
        from: process.env.TWILIO_PHONE_NUMBER, // purchased Twilio number
        to: userData.phone,
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      return res
        .status(500)
        .json({
          message:
            "please check your phone number and try again. Failed to send SMS.",
        });
    }

    res.json({ message: "Email verified. Phone OTP sent." });
  } catch (error) {
    console.error("verifyEmailOtp error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const verifyPhoneOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email });
    if (!otpEntry || !otpEntry.isVerified) {
      return res.status(400).json({ message: "Email not verified yet." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.phoneOtp);

    console.log(isExpired, "isExpired");
    console.log(isValid, "isValid");

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired phone OTP." });
    }

    // ✅ Create real user only now
    const newUser = new User({ ...otpEntry.userData });
    await newUser.save();

    // Delete OTP entry since it's used
    await OTP.deleteOne({ email });

    // 🔔 Send welcome email if teacher
    if (newUser.role === "teacher" && "support@acewallscholars.org") {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@acewallscholars.org",
          pass: "dmwjwyfxaccrdxwi",
        },
      });

      const mailOptions = {
        from: `"${
          process.env.MAIL_FROM_NAME || "Acewall Scholars"
        }" <${"support@acewallscholars.org"}>`,
        to: newUser.email,
        subject: `Welcome to Acewall Scholars as an Instructor`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Welcome to Acewall Scholars, ${newUser.firstName}!</h2>
            <p>Thank you for registering to be an instructor on the <strong>Acewall Scholars Learning Platform</strong>. We are excited to partner with you.</p>
            <p>You can start creating your course now! Before it can be published for purchase, please submit the required documents:</p>
            <ul>
              <li>University Transcripts</li>
              <li>Teachers License or Certifications in field of instruction</li>
              <li>Two Forms of ID:
                <ul>
                  <li>Passport</li>
                  <li>Government issued ID</li>
                  <li>Driver's License</li>
                  <li>Birth Certificate</li>
                </ul>
              </li>
              <li>Resume/CV</li>
            </ul>
            <p><em>(File types allowed: JPG, JPEG, PDF)</em></p>
            <p>We look forward to seeing the impact you will make!</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Instructor welcome email sent to:", newUser.email);
      } catch (emailErr) {
        console.error("❌ Error sending instructor email:", emailErr.message);
      }
    }

    // ✅ issue token
    generateToken(newUser, newUser.role, req, res);

    res.status(201).json({ message: "User created successfully.", newUser });
  } catch (error) {
    console.error("verifyPhoneOtp error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resendPhoneOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(404).json({
        message: "No OTP record found for this email. Please sign up again.",
      });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const phoneOtp = generateOTP();
    const hashedOTP = await bcrypt.hash(phoneOtp, 10);

    otpRecord.phoneOtp = hashedOTP;
    otpRecord.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await otpRecord.save();

    // Resend email
    const userData = otpRecord.userData;

    console.log(userData, "userData");

    // 🚀 Send SMS using purchased number
    await twilioClient.messages.create({
      body: `Your Acewall Scholars phone verification code is: ${phoneOtp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // purchased Twilio number
      to: userData.phone,
    });

    res
      .status(200)
      .json({ message: "New OTP has been sent to your phone number." });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updatePhoneOTP = async (req, res) => {
  const userId = req.user._id;
  const { newPhone } = req.body;

  console.log(newPhone, "newPhone");

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const phoneOtp = generateOTP();
    const hashedOTP = await bcrypt.hash(phoneOtp, 10);

    const phoneNumUpdated = `+${newPhone.replace(/\D+/g, "")}`;

    await OTP.findOneAndUpdate(
      { email: user.email },
      {
        phoneOtp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          phone: phoneNumUpdated,
        },
      },
      { upsert: true }
    );

    // 🚀 Send SMS using purchased number
    await twilioClient.messages.create({
      body: `Your Acewall Scholars phone verification code is: ${phoneOtp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // purchased Twilio number
      to: phoneNumUpdated,
    });

    return res
      .status(200)
      .json({ message: "OTP sent successfully to new phone number" });
  } catch (error) {
    console.error("Error in updatePasswordOTP:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePhone = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpEntry = await OTP.findOne({ email });

    console.log(otpEntry, "otpEntry");

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.phoneOtp);

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    await OTP.updateOne(
      { email },
      {
        $set: {
          isVerified: true,
        },
      }
    );

    const { phone } = otpEntry.userData;

    console.log(otpEntry.userData, "otpEntry.userData");

    await User.findOneAndUpdate({ email: email }, { phone });

    return res
      .status(200)
      .json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.log("error in updatePassword:", error);
    return res.status(500).json("Internal Server Error");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields must be filled",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid Credentials",
      });
    }

    const isAuthorized = await bcrypt.compare(password, user.password);
    if (!isAuthorized) {
      return res.status(401).json({
        error: true,
        message: "Invalid Credentials",
      });
    }

    // ✅ Pass both req and res here
    const token = generateToken(user, user.role, req, res);

    return res.status(200).json({
      message: "Login Successful",
      token, // optional, since cookie is already set
    });
  } catch (error) {
    console.error("error in login==>", error.message);
    return res.status(500).json({
      message: "Something went wrong, sorry for inconvenience",
    });
  }
};

export const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const isExist = await User.findOne({ email });

    if (!isExist) {
      return res.status(404).json({
        message: "User with this email does not exist",
      });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const otp = generateOTP();
    console.log("otp", otp);

    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
      { email },
      {
        otp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          email,
        },
      },
      { upsert: true }
    );

    console.log("working 4");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });

    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: email,
      subject: "Your OTP Code",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Logo -->
      <div style="text-align: center; padding: 20px; background: #ffffff;">
        <img src="https://lirp.cdn-website.com/6602115c/dms3rep/multi/opt/acewall+scholars-431w.png" 
             alt="Acewall Scholars Logo" 
             style="height: 60px; margin: 0 auto;" />
      </div>

      <!-- Header -->
      <div style="background: #28a745; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">OTP Verification</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; text-align: center;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Use the following OTP code to complete your verification:</p>
        
        <div style="margin: 20px auto; display: inline-block; padding: 15px 25px; background: #28a745; color: #fff; font-size: 24px; font-weight: bold; border-radius: 6px; letter-spacing: 3px;">
          ${otp}
        </div>

        <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
      </div>

      <!-- Footer -->
      <div style="background: #f0f4f8; color: #555; text-align: center; padding: 15px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  </div>
  `,
    });

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.log("error in forget Passoword", err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const verifyOTPForgotPassword = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.otp);

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    await OTP.updateOne(
      { email },
      {
        $set: {
          isVerified: true,
        },
      }
    );

    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  console.log(email, newPassword);

  try {
    // Check if OTP was verified
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry || !otpEntry.isVerified) {
      return res.status(400).json({
        message: "OTP not verified or session expired",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.updateOne({ email }, { password: hashedPassword });

    // Clean up the OTP record
    await OTP.deleteOne({ email });

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

export const logout = async (req, res) => {
  try {
    // Detect portal like in generateToken/isUser
    let host = "";
    const origin = req.get("origin");

    if (origin) {
      try {
        host = new URL(origin).hostname;
      } catch (err) {
        console.error("Invalid origin header:", origin);
      }
    }
    if (!host && req.hostname) {
      host = req.hostname;
    }

    const portal = host && host.startsWith("admin.") ? "admin" : "client";
    const cookieName = portal === "admin" ? "admin_jwt" : "client_jwt";

    // Clear the cookie
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // Must match original cookie path
    });

    return res.status(200).json({
      message: `User logged out successfully from ${portal} portal`,
    });
  } catch (error) {
    console.error("Error in logout =>", error.message);
    return res.status(500).json({
      message: "Something went wrong, sorry for the inconvenience",
    });
  }
};

export const allUser = async (req, res) => {
  try {
    const allUser = await User.find();

    res.status(200).json({
      allUser,
      message: "User finded Successfully",
    });
  } catch (error) {
    console.log("error in getting allUser==>", error.message);
    res.status(500).json({
      message: "Some this Went Wrong, sorry for inconvenience",
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.log("error in check Auth", error.message);
    res.status(500).json({
      message: "Internal server Error",
    });
  }
};

export const updateUser = async (req, res) => {
  const userId = req.user._id;

  try {
    let updatedFields = { ...req.body };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    res.json({ message: "User Updated Successfully", updatedUser });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

export const updateUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedFields = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      updatedUser,
    });
  } catch (err) {
    console.error("Admin Update Error:", err);
    if (err.code === 11000) {
      res
        .status(409)
        .json({ message: "Duplicate field value", error: err.keyValue });
    } else {
      res.status(500).json({ message: "Update failed", error: err.message });
    }
  }
};

export const checkUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    } else {
      return res.status(200).json({ message: "User does not exist" });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const allTeacher = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const courseId = req.query.courseId || ""; // course filter

    // Base query
    let query = { role: "teacher" };

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // If courseId is provided, filter teachers who created that course
    if (courseId) {
      // Find all teachers who created the selected course
      const course = await CourseSch.findById(courseId);
      if (course) {
        query._id = course.createdby; // filter by teacher who created this course
      } else {
        // No course found, return empty
        return res.status(200).json({
          total: 0,
          currentPage: page,
          totalPages: 1,
          teachers: [],
        });
      }
    }

    const totalTeachers = await User.countDocuments(query);

    const teachers = await User.find(query)
      .sort({ createdAt: -1 })
      .select("firstName lastName email createdAt profileImg _id")
      .skip(skip)
      .limit(limit);

    const formattedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        // Get all courses of the teacher
        const courses = await CourseSch.find({ createdby: teacher._id }).select("_id");
        return {
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          joiningDate: teacher.createdAt,
          courses: courses.length,
          courseIds: courses.map((c) => c._id), // new field
          profileImg: teacher.profileImg,
          id: teacher._id,
        };
      })
    );

    res.status(200).json({
      total: totalTeachers,
      currentPage: page,
      totalPages: Math.ceil(totalTeachers / limit),
      teachers: formattedTeachers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const allStudent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || ""; // get search term

    // Base query
    const query = { role: "student" };

    // If search provided, add filter (case-insensitive)
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const totalStudents = await User.countDocuments(query);

    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .select("firstName lastName email createdAt courses profileImg _id")
      .skip(skip)
      .limit(limit);

    const formattedStudents = students.map((student) => ({
      name: `${student.firstName} ${student.lastName}`,
      email: student.email,
      joiningDate: student.createdAt,
      numberOfCourses: student.courses?.length || 0,
      profileImg: student.profileImg,
      id: student._id,
    }));

    res.status(200).json({
      total: totalStudents,
      currentPage: page,
      totalPages: Math.ceil(totalStudents / limit),
      students: formattedStudents,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get student/user info
    const user = await User.findById(id).select(
      "id firstName middleName lastName email profileImg createdAt phone homeAddress mailingAddress pronoun gender role guardianEmails"
    );
    
    if (!user) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Use aggregation to get enrollments with course and teacher info
    const enrollments = await Enrollment.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(id) } },

      // Lookup course
      {
        $lookup: {
          from: "coursesches", // collection name (check actual collection if pluralized)
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },

      // Lookup teacher info from createdby field in course
      {
        $lookup: {
          from: "users", // collection name for teachers
          localField: "course.createdby",
          foreignField: "_id",
          as: "course.createdby",
        },
      },
      { $unwind: "$course.createdby" },

      // Optionally project only necessary fields
      {
        $project: {
          _id: 1,
          course: {
            courseTitle: 1,
            courseDescription: 1,
            createdby: {
              firstName: 1,
              lastName: 1,
              email: 1,
            },
          },
          // exclude student field
        },
      },
    ]);

    res.status(200).json({
      user,
      enrollments,
      message: "Student and enrollments fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error." });
  }
};


export const getTeacherById = async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await User.findById(id).select(
      " id firstName middleName lastName email profileImg createdAt phone homeAddress mailingAddress pronoun gender role"
    );
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const courses = await CourseSch.aggregate([
      { $match: { createdby: new mongoose.Types.ObjectId(id) } },
      { $project: { courseTitle: 1, courseDescription: 1, _id: 1 } },
    ]);

    res.status(200).json({ teacher, courses });
  } catch (error) {
    console.error("Error fetching teacher by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserInfo = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json("User not found");
    }
    console.log(user, "user");
    return res.status(200).json({ message: "User found successfully", user });
  } catch (error) {
    console.log("error in getUserInfo:", error);
    return res.status(500).json("Internal Server Error");
  }
};
export const updateProfileImg = async (req, res) => {
  const userId = req.user._id;
  const file = req.file;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete previous image from Cloudinary
    if (user.profileImg?.publicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImg.publicId);
      } catch (err) {
        console.warn(
          "Failed to delete previous image from Cloudinary:",
          err.message
        );
      }
    }

    // Upload new image
    const result = await uploadToCloudinary(file.buffer, "profile_images");

    // Update user's profileImg field
    user.profileImg = {
      url: result.secure_url,
      filename: result.original_filename,
      publicId: result.public_id,
    };

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile image updated successfully", user });
  } catch (error) {
    console.error("Error in updateProfileImg:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUserProfileImgById = async (req, res) => {
  const userId = req.params.id; // Admin-specified user ID
  const file = req.file;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete previous image from Cloudinary
    if (user.profileImg?.publicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImg.publicId);
      } catch (err) {
        console.warn(
          "Failed to delete previous image from Cloudinary:",
          err.message
        );
      }
    }

    // Upload new image
    const result = await uploadToCloudinary(file.buffer, "profile_images");

    // Update user's profileImg field
    user.profileImg = {
      url: result.secure_url,
      filename: result.original_filename,
      publicId: result.public_id,
    };

    await user.save();

    return res.status(200).json({
      message: "Profile image updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error in updateUserProfileImgById:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// DELETE /admin/users/:userId
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: delete profile image
    if (user.profileImg?.publicId) {
      console.log(`Deleting profile image: ${user.profileImg.publicId}`);
      // await cloudinary.v2.uploader.destroy(user.profileImg.publicId);
    }

    // Delete all enrollments first
    await Enrollment.deleteMany({ student: user._id });
    console.log(`Deleted all enrollments for user ${user._id}`);

    // Then delete the user
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      message: "Student and all their enrollments deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const updatePasswordOTP = async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate old password
    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Reject if newPassword === old password
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    // Check if new and confirm password match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 11);

    // Generate OTP
    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Save OTP and password update request
    await OTP.findOneAndUpdate(
      { email: user.email },
      {
        otp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          newPassword: newHashedPassword,
        },
      },
      { upsert: true }
    );

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });

    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Logo -->
      <div style="text-align: center; padding: 20px; background: #ffffff;">
        <img src="https://lirp.cdn-website.com/6602115c/dms3rep/multi/opt/acewall+scholars-431w.png" 
             alt="Acewall Scholars Logo" 
             style="height: 60px; margin: 0 auto;" />
      </div>

      <!-- Header -->
      <div style="background: #28a745; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">OTP Verification</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; text-align: center;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Use the following OTP code to complete your verification:</p>
        
        <div style="margin: 20px auto; display: inline-block; padding: 15px 25px; background: #28a745; color: #fff; font-size: 24px; font-weight: bold; border-radius: 6px; letter-spacing: 3px;">
          ${otp}
        </div>

        <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
      </div>

      <!-- Footer -->
      <div style="background: #f0f4f8; color: #555; text-align: center; padding: 15px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  </div>
  `,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in updatePasswordOTP:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePassword = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.otp);

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    await OTP.updateOne(
      { email },
      {
        $set: {
          isVerified: true,
        },
      }
    );

    const { newPassword } = otpEntry.userData;

    await User.updateOne({ email }, { password: newPassword });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log("error in updatePassword:", error);
    return res.status(500).json("Internal Server Error");
  }
};

export const updateEmailOTP = async (req, res) => {
  const userId = req.user._id;
  const userEmail = req.user.email;
  const { newEmail, prevEmail } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isExist = await User.findOne({ email: newEmail });
    if (isExist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }

      return otp;
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
      { email: user.email },
      {
        otp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          newEmail: newEmail,
        },
      },
      { upsert: true }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });

    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafc; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: #10b981; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">OTP Verification</h2>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; text-align: center;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Here is your OTP code:</p>
        
        <div style="margin: 20px auto; display: inline-block; padding: 12px 24px; background: #10b981; color: #fff; font-size: 22px; font-weight: bold; border-radius: 6px; letter-spacing: 3px;">
          ${otp}
        </div>

        <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
      </div>

      <!-- Footer -->
      <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  </div>
  `,
    });

    return res
      .status(200)
      .json({ message: "OTP sent successfully to previous email" });
  } catch (error) {
    console.error("Error in updatePasswordOTP:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.otp);

    console.log(isExpired, "isExpired");
    console.log(isValid, "isValid");

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    await OTP.updateOne(
      { email },
      {
        $set: {
          isVerified: true,
        },
      }
    );

    const { newEmail } = otpEntry.userData;

    await User.findOneAndUpdate({ email: email }, { email: newEmail });

    return res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.log("error in updatePassword:", error);
    return res.status(500).json("Internal Server Error");
  }
};

export const updateEmailOTPById = async (req, res) => {
  const { id } = req.params;
  const { newEmail } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isExist = await User.findOne({ email: newEmail });
    if (isExist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }
      return otp;
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
      { email: user.email },
      {
        otp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          newEmail,
        },
      },
      { upsert: true }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });

    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafc; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: #10b981; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">OTP Verification</h2>
        </div>

        <!-- Body -->
        <div style="padding: 20px; color: #333; text-align: center;">
          <p style="font-size: 16px; margin: 0;">Hello${
            user.firstName ? ` ${user.firstName}` : ""
          },</p>
          <p style="font-size: 16px;">Your OTP code is:</p>
          
          <div style="margin: 20px auto; display: inline-block; padding: 12px 24px; background: #10b981; color: #fff; font-size: 22px; font-weight: bold; border-radius: 6px; letter-spacing: 3px;">
            ${otp}
          </div>

          <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>

        <!-- Footer -->
        <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
          <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
          <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
        </div>
      </div>
    </div>
  `,
    });

    return res
      .status(200)
      .json({ message: "OTP sent successfully to previous email" });
  } catch (error) {
    console.error("Error in updateEmailOTPById:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateEmailById = async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpEntry = await OTP.findOne({ email: user.email });

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.otp);

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const { newEmail } = otpEntry.userData;

    await OTP.updateOne(
      { email: user.email },
      {
        $set: { isVerified: true },
      }
    );

    await User.findByIdAndUpdate(id, { email: newEmail });

    return res.status(200).json({ message: "Email updated successfully" });
  } catch (error) {
    console.log("Error in updateEmailById:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePasswordOTPById = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        message: "New password must be different from the old password",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 11);

    function generateOTP(length = 6) {
      const digits = "0123456789";
      let otp = "";
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % digits.length];
      }
      return otp;
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
      { email: user.email },
      {
        otp: hashedOTP,
        expiresAt: Date.now() + 10 * 60 * 1000,
        userData: {
          newPassword: newHashedPassword,
        },
      },
      { upsert: true }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@acewallscholars.org",
        pass: "dmwjwyfxaccrdxwi",
      },
    });

    await transporter.sendMail({
      from: `"OTP Verification" <support@acewallscholars.org>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafc; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: #10b981; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">OTP Verification</h2>
        </div>

        <!-- Body -->
        <div style="padding: 20px; color: #333; text-align: center;">
          <p style="font-size: 16px; margin: 0;">Hello${
            user.firstName ? ` ${user.firstName}` : ""
          },</p>
          <p style="font-size: 16px;">Your OTP code is:</p>
          
          <div style="margin: 20px auto; display: inline-block; padding: 12px 24px; background: #10b981; color: #fff; font-size: 22px; font-weight: bold; border-radius: 6px; letter-spacing: 3px;">
            ${otp}
          </div>

          <p style="font-size: 14px; margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>

        <!-- Footer -->
        <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
          <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
          <p style="margin: 0;">If you did not request this code, please ignore this email.</p>
        </div>
      </div>
    </div>
  `,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in updatePasswordOTPById:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePasswordById = async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpEntry = await OTP.findOne({ email: user.email });

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: "OTP not found or already used." });
    }

    const isExpired = Date.now() > otpEntry.expiresAt;
    const isValid = await bcrypt.compare(otp, otpEntry.otp);

    if (!isValid || isExpired) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const { newPassword } = otpEntry.userData;

    await User.updateOne({ _id: id }, { password: newPassword });

    await OTP.updateOne({ email: user.email }, { $set: { isVerified: true } });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in updatePasswordById:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const previewSignIn = async (req, res) => {
  const user = req.user;

  try {
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "No user found",
      });
    }

    // Clear old cookie
    res.clearCookie("client_jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    const prevRole = "teacherAsStudent";

    // Generate new token with new role
    generateToken(user, prevRole, req, res);

    // Return the updated user object
    const updatedUser = { ...user, role: prevRole };

    return res.status(200).json({
      message: "Preview Signin Successful",
      user: updatedUser, // Send back the updated user
    });
  } catch (error) {
    console.error("error in Preview Signin", error.message);
    return res.status(500).json({
      message: "Something went wrong, sorry for inconvenience",
    });
  }
};

export const previewSignOut = async (req, res) => {
  const user = req.user;
  try {
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "No user found",
      });
    }

    // Clear old cookie
    res.clearCookie("client_jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    const teacherUser = await User.findById(req.user._id);
    if (!teacherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new token with new role
    generateToken(teacherUser, teacherUser.role, req, res);

    // Return the updated user object
    return res.status(200).json({
      message: "Preview Signin Successful",
    });
  } catch (error) {
    console.error("error in Preview Signin", error.message);
    return res.status(500).json({
      message: "Something went wrong, sorry for inconvenience",
    });
  }
};

export const updateParentEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { guardianEmails } = req.body;

    // Validate that guardianEmails is provided and an array
    if (!Array.isArray(guardianEmails) || guardianEmails.length === 0) {
      return res.status(400).json({ message: "Please provide at least one guardian email" });
    }

    // Limit to max 4 emails
    if (guardianEmails.length > 4) {
      return res.status(400).json({ message: "You can only add up to 4 guardian emails" });
    }

    // Validate each email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = guardianEmails.filter(email => !emailRegex.test(email.trim()));
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        message: `Invalid email(s): ${invalidEmails.join(", ")}`,
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update guardian emails
    user.guardianEmails = guardianEmails.map(email => email.trim());
    await user.save();

    return res.status(200).json({
      message: "Guardian emails updated successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error in updateParentEmail:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getChildrenData = async (req, res) => {
  try {
    // We assume the parent is logged in and their email is in req.user.email
    const parentEmail = req.user.email;

    // Find all students where the parent's email exists in the guardianEmails array
    const children = await User.find({
      role: { $in: ["student", "teacherAsStudent"] },
      guardianEmails: parentEmail // MongoDB automatically checks if the string exists in the array
    })
    .select("-password") // Exclude sensitive info
    .lean();

    if (!children || children.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No students found associated with this parent email." 
      });
    }

    res.status(200).json({
      success: true,
      count: children.length,
      children
    });
  } catch (error) {
    console.error("Error fetching children data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};