import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    rawText: { type: String, required: true },
    originalfile: { type: String, required: true },
});

const Book = mongoose.model("Book", bookSchema);

export default Book;