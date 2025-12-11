import mongoose from "mongoose";

const AIChatSchema = new mongoose.Schema({
    userId: String,
    question: String,
    answer: String,
    difficulty: String,
    createdAt: { type: Date, default: Date.now },
});

const AIChat = mongoose.model("AIChat", AIChatSchema);

export default AIChat;