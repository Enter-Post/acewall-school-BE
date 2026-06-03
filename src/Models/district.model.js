import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DistrictSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      unique: true,
      sparse: true,
    },

    logo: {
      type: String,
      default: "",
    },

    contactEmail: {
      type: String,
    },

    phone: {
      type: String,
    },

    address: {
      type: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // 🔌 ALL external system configuration lives here
    integrations: {
      clever: {
        enabled: { type: Boolean, default: false },
        clientId: { type: String },
        clientSecret: { type: String },
        districtExternalId: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },

        lastSyncAt: { type: Date },
      },

      canvas: {
        enabled: { type: Boolean, default: false },
        baseUrl: { type: String },
        clientId: { type: String },
        clientSecret: { type: String },
        accessToken: { type: String },
        lastSyncAt: { type: Date },
      },

      oneroster: {
        enabled: { type: Boolean, default: false },
        baseUrl: { type: String },
        clientId: { type: String },
        clientSecret: { type: String },
        accessToken: { type: String },
        lastSyncAt: { type: Date },
      },

      lti: {
        enabled: { type: Boolean, default: false },
        issuer: { type: String },
        clientId: { type: String },
        deploymentId: { type: String },
        jwksUrl: { type: String },
        lastSyncAt: { type: Date },
      },
    },
  },
  { timestamps: true }
);

DistrictSchema.plugin(mongoosePaginate);

const District =
  mongoose.models.District || mongoose.model("District", DistrictSchema);

export default District;