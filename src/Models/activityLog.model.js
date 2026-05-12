import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "click",
        "page_view",
        "form_submit",
        "api_call",
        "action",
        "error",
        "login",
        "logout",
        "enrollment",
        "assignment_submit",
        "quiz_submit",
        "file_upload",
        "purchase",
        "message",
      ],
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    page: {
      type: String,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    entitySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    browser: {
      type: String,
      required: false,
    },
    browserVersion: {
      type: String,
      required: false,
    },
    os: {
      type: String,
      required: false,
    },
    deviceType: {
      type: String,
      enum: ["Desktop", "Mobile", "Tablet", "Wearable", "Console", "SmartTV", "Unknown"],
      default: "Desktop",
    },
    statusCode: {
      type: Number,
      required: false,
    },
    responseTime: {
      type: Number,
      required: false,
    },
    method: {
      type: String,
      required: false,
    },
    level: {
      type: String,
      enum: ["info", "warning", "error", "debug"],
      default: "info",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // District and School isolation for audit trail
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
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ type: 1, timestamp: -1 });
ActivityLogSchema.index({ event: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete logs older than 90 days (configurable)
// This can be adjusted based on your retention policy
ActivityLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
