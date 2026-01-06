import mongoose from "mongoose";

const guardianAccSchema = new mongoose.Schema({
    email: { type: String, required: true },
})

const GuardianAcc = mongoose.model("GuardianAcc", guardianAccSchema);

export default GuardianAcc;