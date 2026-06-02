import mongoose from "mongoose";

const SchoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
      index: true,
    },

    schoolLogo: {
      type: String,
    },

    homeAddress: {
      type: String,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    website: {
      type: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // 🔗 External system mapping ONLY (NO credentials here)
    externalMappings: {
      clever: {
        schoolId: { type: String },
        lastSyncAt: { type: Date },
        syncStatus: {
          type: String,
          enum: ["pending", "synced", "failed"],
          default: "pending",
        },
      },

      canvas: {
        accountId: { type: String },
        lastSyncAt: { type: Date },
        syncStatus: {
          type: String,
          enum: ["pending", "synced", "failed"],
          default: "pending",
        },
      },

      oneroster: {
        schoolId: { type: String },
        lastSyncAt: { type: Date },
        syncStatus: {
          type: String,
          enum: ["pending", "synced", "failed"],
          default: "pending",
        },
      },

      lti: {
        contextId: { type: String },
        deploymentId: { type: String },
        lastSyncAt: { type: Date },
        syncStatus: {
          type: String,
          enum: ["pending", "synced", "failed"],
          default: "pending",
        },
      },
    },

    settings: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// indexes
SchoolSchema.index({ districtId: 1, name: 1 });

const School =
  mongoose.models.School || mongoose.model("School", SchoolSchema);

export default School;