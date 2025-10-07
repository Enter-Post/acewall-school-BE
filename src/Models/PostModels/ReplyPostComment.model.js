import mongoose from "mongoose";

const ReplyPostComment = mongoose.Schema({
    text: { type: String, required: true },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "PostComment" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
})

const ReplyPostComments = mongoose.model("ReplyPostComment", ReplyPostComment)

export default ReplyPostComments