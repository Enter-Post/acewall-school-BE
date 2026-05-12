import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    // District and School isolation for new categories
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true, 
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;
