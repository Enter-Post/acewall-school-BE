import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["live-class", "assignment", "general"],
    default: "general",
  },
  link: {
    type: String,
  }, // e.g., /student/courses/live-classes/ID
  isRead: {
    type: Boolean,
    default: false,
  },
  isEnded: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // Automatically delete notifications after 7 days
  },
  // District and School isolation for new notifications
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "District",
    index: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    index: true,
  },
  isDeleted: { type: Boolean, default: false }
});

export const Notification = mongoose.model("Notification", notificationSchema);
