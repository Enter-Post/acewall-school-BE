import mongoose from "mongoose";

const LTIPlatformSchema = new mongoose.Schema({
  platform_name: {
    type: String,
    required: true,
  },

  // REQUIRED for JWT validation
  issuer: {
    type: String,
    required: true,
  },

  client_id: {
    type: String,
    required: true,
  },

  deployment_id: {
    type: String,
    required: true,
  },

  // OIDC endpoints (used in login flow)
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

  // where platform sends launch request
  redirect_uri: {
    type: String,
    required: true,
  },

  // optional but useful
  active: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

const LTIPlatform = mongoose.model("LTIPlatform", LTIPlatformSchema);
export default LTIPlatform;