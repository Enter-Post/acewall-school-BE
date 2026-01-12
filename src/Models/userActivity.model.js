import mongoose from "mongoose";

const LoginActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    loginAt: {
        type: Date,
        default: Date.now,
    },
    ipAddress: String,
    userAgent: String,
});

const LoginActivity = mongoose.model("LoginActivity", LoginActivitySchema);

export default LoginActivity;