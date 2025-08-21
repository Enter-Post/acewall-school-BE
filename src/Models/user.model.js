import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    profileImg: {
      url: { type: String },
      filename: { type: String },
      publicId: { type: String },
    },

    firstName: { type: String, required: true },
    Bio: { type: String },
    middleName: { type: String },
    lastName: { type: String, required: true },
    pronoun: {
      type: String,
      enum: ["he/him", "she/her", "they/them", "others","prefer not to say"],
      required: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "other","prefer not to say"],
      required: false,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    homeAddress: { type: String },
    mailingAddress: { type: String },
    password: { type: String, required: true },
    // documents: {
    //   type: [
    //     {
    //       name: String, // Document name (e.g., "Teaching Certificate", "ID")
    //       url: String, // URL or file path of the document
    //       verified: { type: Boolean, default: false }, // Verification status
    //     },
    //   ],
    //   required: function () {
    //     return this.role === "teacher";
    //   }, // Required only if role is "Teacher"
    // },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
