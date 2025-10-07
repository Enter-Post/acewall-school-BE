import Posts from "../../Models/PostModels/post.model.js";
import PostLike from "../../Models/PostModels/postLikes.model.js";

export const likePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    try {
        const post = await Posts.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const isLiked = await PostLike.findOne({ post: id, likedBy: userId });
        if (isLiked && isLiked.isLiked) {
            isLiked.isLiked = false;
            await isLiked.save()
            return res.status(200).json({ message: "Post unliked successfully" });
        } else if (isLiked && !isLiked.isLiked) {
            isLiked.isLiked = true;
            await isLiked.save()
            return res.status(200).json({ message: "Post liked successfully" });
        } else {
            const newLike = new PostLike({
                post: id,
                likedBy: userId,
                isLiked: true
            });
            await newLike.save();
            return res.status(200).json({ message: "Post new liked successfully" });
        }

    } catch (error) {
        console.log("error in likePost", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const isPostLiked = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isLiked = await PostLike.findOne({ post: id, likedBy: userId });
        if (isLiked && isLiked.isLiked) {
            return res.status(200).json({ message: "Post is liked" });
        } else {
            return res.status(200).json({ message: "Post is not liked" });
        }
    } catch (error) {
        console.log("error in isPostLiked", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}