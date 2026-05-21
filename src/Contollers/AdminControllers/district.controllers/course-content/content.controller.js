import mongoose from "mongoose";
import Chapter from "../../../../Models/chapter.model.sch.js";
import Lesson from "../../../../Models/lesson.model.sch.js";
import Assessment from "../../../../Models/Assessment.model.js";
import Discussion from "../../../../Models/discussion.model.js";
import Pages from "../../../../Models/Pages.modal.js";
import DiscussionReply from "../../../../Models/replyDiscussion.model.js";

export const getContentDetail = async (req, res) => {
    const { type, contentId: id } = req.params;

    try {
        if (!id || !type) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        let content;
        switch (type.toLowerCase()) {
            case "chapter":
                content = await Chapter.findById(id);
                break;
            case "lesson":
                content = await Lesson.findById(id);
                break;
            case "assessment":
                content = await Assessment.findById(id).populate("category");
                break;
            case "discussion":
                content = await Discussion.findById(id).populate("category");
                break;
            case "page":
                content = await Pages.findById(id);
                break;
            default:
                return res.status(400).json({ message: "Invalid content type" });
        }

        if (!content || content.isDeleted) {
            return res.status(404).json({ message: `${type} not found` });
        }

        res.status(200).json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} fetched successfully`,
            content
        });
    } catch (error) {
        console.error(`Error in getContentDetail (${type}):`, error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
