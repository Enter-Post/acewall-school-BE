import mongoose from "mongoose";

const PostComment = mongoose.Schema({
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost" },
    // District and School isolation for new post comments
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
}, { timestamps: true })

const PostComments = mongoose.model("PostComment", PostComment)

export default PostComments