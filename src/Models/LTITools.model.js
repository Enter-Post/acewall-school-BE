import mongoose from "mongoose";

const LTIToolSchema = new mongoose.Schema({
  tool_name: {
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
  issuer: {
    type: String,
    required: true,
  },
  auth_login_url: {
    type: String,
    required: true,
  },
  auth_token_url: {
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
}, { timestamps: true });

const LTITool = mongoose.model("LTITool", LTIToolSchema);
export default LTITool;
