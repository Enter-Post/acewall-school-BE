import mongoose from 'mongoose';

// Subcategory schema
const SubcategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Reference to parent category
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Subcategory = mongoose.model('Subcategory', SubcategorySchema);
export default Subcategory;