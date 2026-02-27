import mongoose from "mongoose";

const SchoolSchema = new mongoose.Schema({
  schoollogo: {
    type: String,
    default:
      "https://res.cloudinary.com/dhylynexh/image/upload/v1745191204/image-removebg-preview_cc47c1.png",
  },
  schoolname: {
    type: String,
    required: true,
  },
  homeAddress: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  website: { type: String },
  edlinkConnection: {
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
  },
});
const School = mongoose.models.School || mongoose.model("School", SchoolSchema);
export default School;
