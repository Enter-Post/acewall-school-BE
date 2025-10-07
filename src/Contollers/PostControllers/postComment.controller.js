import Posts from "../../Models/PostModels/post.model";
import PostComments from "../../Models/PostModels/postComment.model";

export const sendPostComment = async (req, res) => {
    const userId = req.user._id
    const { id } = req.params;
    const { text } = req.body;
    try {
        const isExist = await Posts.findById(id);
        if (!isExist) {
            return res.status(404).json({
                message: "Post does not exist",
            });
        }

        const newComment = new PostComments({
            text,
            author: userId,
            post: id,
        });

        await newComment.save();

        res.status(200).json({
            message: "Comment sent successfully",
            newComment,
        });
    } catch (error) {
        console.log("error in sendComment", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};