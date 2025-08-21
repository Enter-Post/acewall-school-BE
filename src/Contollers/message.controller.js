import { getRecieverSocketId } from "../lib/socket.io.js";
import Message from "../Models/messages.model.js";

export const createMessage = async (req, res) => {
  const { conversationId } = req.params;
  const myId = req.user._id;
  const { text } = req.body;
  try {
    const newMessage = new Message({
      conversationId,
      text,
      sender: myId,
    });
    await newMessage.save();

    const receiverSocketId = getRecieverSocketId(conversationId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    const populatedMessage = await newMessage.populate(
      "sender",
      "firstName lastName profileImg"
    );
    res.status(200).json({
      message: "message created successfully",
      newMessage: populatedMessage,
    });
  } catch (err) {
    console.log("error in createMessage", err);
    res.status(500).json(err);
  }
};

export const getConversationMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const messages = await Message.find({ conversationId }).populate(
      "sender",
      "firstName lastName profileImg"
    );
    res.status(200).json({
      message: "messages fetched successfully",
      messages,
    });
  } catch (err) {
    console.log("error in getConversationMessages", err);
    res.status(500).json(err);
  }
};
