import mongoose from "mongoose";

const ReplyPostComment = mongoose.Schema({
    text: { type: String, required: true },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "PostComment" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // District and School isolation for new reply post comments
    districtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "District",
        required: false, // Optional for backward compatibility
        index: true,
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: false, // Optional for backward compatibility
        index: true,
    },
    isDeleted: { type: Boolean, default: false }
})

const ReplyPostComments = mongoose.model("ReplyPostComment", ReplyPostComment)

export default ReplyPostComments