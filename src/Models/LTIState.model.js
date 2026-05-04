import mongoose from "mongoose";

const ltiStateSchema = new mongoose.Schema({
    state: { type: String, required: true, unique: true },
    nonce: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // ⏱️ 600 seconds = 10 minutes
    }
});

const LTIState = mongoose.model("LTIState", ltiStateSchema);
export default LTIState;