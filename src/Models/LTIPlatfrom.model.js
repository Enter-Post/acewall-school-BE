import mongoose from "mongoose";

const LTIPlatformSchema = new mongoose.Schema({
  platform_name: {
    type: String,
    required: true,
  },

  issuer: {
    type: String,
    required: true,
  },

  client_id: {
    type: String,
    required: true,
  },

  deployments: {
    type: [String],
    default: [],
  },

  authorization_endpoint: {
    type: String,
    required: true,
  },

  token_endpoint: {
    type: String,
    required: true,
  },

  jwks_url: {
    type: String,
    required: true,
  },

  redirect_uris: {
    type: [String],
    required: true,
  },

  initiate_login_url: String,
  launch_url: String,

  active: {
    type: Boolean,
    default: true,
  },

  public_key: {
    type: String,
  },

}, { timestamps: true });

const LTIPlatform = mongoose.model("LTIPlatform", LTIPlatformSchema);
export default LTIPlatform;