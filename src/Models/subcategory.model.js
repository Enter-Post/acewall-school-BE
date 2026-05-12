import mongoose from 'mongoose';

// Subcategory schema
const SubcategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Reference to parent category
    // District and School isolation for new subcategories
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: false, // Optional for backward compatibility
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: false, // Optional for backward compatibility
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Subcategory = mongoose.model('Subcategory', SubcategorySchema);
export default Subcategory;