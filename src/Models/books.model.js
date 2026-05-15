import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    rawText: { type: String, required: true },
    originalfile: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    districtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "District",
        required: true, // Optional for backward compatibility
        index: true,
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true, // Optional for backward compatibility
        index: true,
    },

});

const Book = mongoose.model("Book", bookSchema);

export default Book;