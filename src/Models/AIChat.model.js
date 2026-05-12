import mongoose from "mongoose";

const AIChatSchema = new mongoose.Schema({
    userId: String,
    question: {
        text: String,
        sender: String
    },
    answer: {
        text: String,
        sender: String
    },
    generatedFile: {
        url: String,
        filename: String,
        sender: String,
        FileType: String
    },
    file: {
        url: String,
        filename: String,
        sender: String
    },
    difficulty: String,
    fileUsed: String,
    // District and School isolation for new AI chat sessions
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
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true }
);

const AIChat = mongoose.model("AIChat", AIChatSchema);

export default AIChat;