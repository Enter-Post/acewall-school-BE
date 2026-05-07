import mongoose from "mongoose";

const guardianAccSchema = new mongoose.Schema({
    email: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
})

const GuardianAcc = mongoose.model("GuardianAcc", guardianAccSchema);

export default GuardianAcc;