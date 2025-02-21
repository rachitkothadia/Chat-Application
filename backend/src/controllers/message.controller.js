import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import axios from "axios"; // For calling ML API

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
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
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    console.log("Received message data:", { senderId, receiverId, text });

    // Check if ML API is causing the error
    const isHarmful = await checkMessageWithML(text);
    console.log("ML API Response:", isHarmful);

    if (isHarmful) {
      const banDuration = await updateBanStatus(senderId);
      console.log(`User ${senderId} banned for ${banDuration} minutes.`);

      return res.status(403).json({ message: `You are banned for ${banDuration} minutes.` });
    }

    const newMessage = new Message({ senderId, receiverId, text });
    await newMessage.save();
    console.log("Message saved successfully:", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};