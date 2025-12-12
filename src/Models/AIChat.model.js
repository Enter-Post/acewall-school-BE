import mongoose from "mongoose";

const AIChatSchema = new mongoose.Schema({
    userId: String,
    question: {
        text: String,
        sender: String
    },
    file: {
        url: String,
        filename: String,
        publicId: String,
        sender: String
    },
    answer: {
        text: String,
        sender: String
    },
    difficulty: String,
    createdAt: { type: Date, default: Date.now },
});

const AIChat = mongoose.model("AIChat", AIChatSchema);

export default AIChat;