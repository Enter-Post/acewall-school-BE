import mongoose from "mongoose";

const ConversationSchema = mongoose.Schema(
  {
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    lastSeen: {
      type: Map, // stores userId -> ISO string
      of: Date,
      default: {},
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;
