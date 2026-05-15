import mongoose from "mongoose";

const guardianAccSchema = new mongoose.Schema({
    email: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    districtId: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
})

const GuardianAcc = mongoose.model("GuardianAcc", guardianAccSchema);

export default GuardianAcc;