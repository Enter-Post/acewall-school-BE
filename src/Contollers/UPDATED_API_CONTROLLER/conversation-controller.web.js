import mongoose from "mongoose";
import Conversation from "../../Models/conversation.model.js";
import Message from "../../Models/messages.model.js";

export const getMyConversations_updated = async (req, res) => {
  const myId = req.user._id;

  try {
    const conversations = await Conversation.find({ members: myId }).populate({
      path: "members",
      select: "firstName lastName profileImg",
    });

    console.log(conversations, "conversations");

    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherMember = conversation.members.find(
          (member) => member._id.toString() !== myId.toString()
        );

        // ✅ Get unread count
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          sender: { $ne: myId },
          readBy: { $ne: myId },
        });

        console.log(otherMember, "otherMember");

        return {
          conversationId: conversation._id,
          otherMember: {
            name: `${otherMember.firstName} ${otherMember.lastName}`,
            profileImg: otherMember.profileImg,
          },
          lastSeen: conversation.lastSeen,
          lastMessage: conversation.lastMessage,
          lastMessageDate: conversation.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      message: "Conversations fetched successfully",
      conversations: formattedConversations,
    });
  } catch (err) {
    console.error("Error in getMyConversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /conversations/lastSeen/:conversationId
export const updateLastSeen = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`lastSeen.${userId}`]: new Date() },
    });

    res.status(200).json({ message: "Last seen updated" });
  } catch (err) {
    console.error("Error updating last seen:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
