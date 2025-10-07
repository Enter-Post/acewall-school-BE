export const sendReplyofComment = () => {
    try {

    } catch (error) {
        console.log("error in sendReplyofComment", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}