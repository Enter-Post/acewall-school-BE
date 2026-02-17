import mongoose from "mongoose";
import Enrollment from "../Models/Enrollement.model.js";
import Assessment from "./Assessment.model.js";
const UserSchema = new mongoose.Schema(
  {
    profileImg: {
      url: { type: String },
      filename: { type: String },
      publicId: { type: String },
    },
    firstName: { type: String },
    Bio: { type: String },
    middleName: { type: String },
    lastName: { type: String },
    pronoun: {
      type: String,
      enum: ["he/him", "she/her", "they/them", "others", "prefer not to say"],
      required: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "other", "prefer not to say"],
      required: false,
    },
    role: {
      type: String,
      enum: [
        "student",
        "teacher",
        "admin",
        "teacherAsStudent",
        "parent",
        "instructor",
      ],
      required: true,
    },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    homeAddress: { type: String },
    mailingAddress: { type: String },
    password: { type: String, required: false },
    cleverId: { type: String, unique: true, sparse: true },
    districtId: { type: String },
    schoolIds: [{ type: String }],
    authProvider: {
      type: String,
      enum: ["local", "google", "clever"],
      default: "local",
    },
    guardianEmails: [{ type: String }],
    guardianEmailPreferences: {
      submission: { type: Boolean, default: true },
      grading: { type: Boolean, default: true },
      announcement: { type: Boolean, default: true },
      assessments: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// 🔹 Pre-remove hook to delete all enrollments when a user is deleted
UserSchema.pre("remove", async function (next) {
  try {
    await Enrollment.deleteMany({ student: this._id });
    console.log(`Deleted all enrollments for user ${this._id}`);
    next();
  } catch (err) {
    console.error("Error deleting enrollments in pre-remove hook:", err);
    next(err);
  }
});

const User = mongoose.model("User", UserSchema);
export default User;
