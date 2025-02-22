import User from "../models/user.model.js";
import { updateBanStatus } from "../lib/utils.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const BAD_WORDS = ["chutiya", "dickhead", "gandu","madharchod","randi","fuck","shit","ass","cum","teri maa ki chut","lund","chutpaglu"]; // Add real abusive words here

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId and receiverId are required." });
    }

    let isHarmful = BAD_WORDS.some((word) => text.toLowerCase().includes(word));

    if (isHarmful) {
      const banDuration = await updateBanStatus(senderId);

      // **Socket.io Warning Before Ban**
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("warningMessage", {
          message: "You are temporarily suspended from SecureChat.",
          duration: banDuration,
        });
      }

      return res.status(403).json({ message: `You are banned for ${banDuration} minutes.` });
    }

    const newMessage = new Message({ senderId, receiverId, text });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        isHarmful,
      });
    }

    // Emit event to sender for message confirmation
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSentConfirmation", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
