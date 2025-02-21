import axios from "axios";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";
import { io, getReceiverSocketId } from "./lib/socket.js";

const ML_API_URL = process.env.ML_API_URL || "https://your-ml-api.onrender.com/predict";

// Function to check messages with ML API
export async function checkMessageWithML(text) {
  try {
    const response = await axios.post(ML_API_URL, { text });
    return response.data.is_harmful; // Expecting ML API to return true/false
  } catch (error) {
    console.error("ML API error:", error.message);
    return false; // Assume safe if ML API fails
  }
}

// Function to update ban status in MongoDB
export async function updateBanStatus(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  // If already banned, prevent re-banning
  if (user.isBanned && user.banExpires && new Date(user.banExpires) > new Date()) {
    return null;
  }

  user.flagged = (user.flagged || 0) + 1;

  // Define ban durations
  const banDurations = [5, 60, 300, 1440, Infinity]; // Minutes
  const banDuration = banDurations[user.flagged - 1] || Infinity;

  user.isBanned = true;
  user.banExpires = banDuration === Infinity ? null : new Date(Date.now() + banDuration * 60000).toISOString();

  await user.save();
  return banDuration;
}

// Middleware to monitor messages and ban users if needed
io.on("connection", (socket) => {
  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    try {
      const isHarmful = await checkMessageWithML(text);

      if (isHarmful) {
        const banDuration = await updateBanStatus(senderId);

        if (banDuration) {
          socket.emit("banned", { duration: banDuration });
          console.log(`User ${senderId} banned for ${banDuration} minutes.`);
        }
      }

      // Save message only if user is NOT banned
      const sender = await User.findById(senderId);
      if (!sender.isBanned) {
        const newMessage = new Message({ senderId, receiverId, text });
        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    } catch (error) {
      console.error("Error handling message:", error.message);
    }
  });
});

// Unban users every 1 minute
setInterval(async () => {
  try {
    const now = new Date();
    const updatedUsers = await User.updateMany(
      { isBanned: true, banExpires: { $lte: now.toISOString() } },
      { isBanned: false, flagged: 0, banExpires: null }
    );
    if (updatedUsers.modifiedCount > 0) {
      console.log(`Unbanned ${updatedUsers.modifiedCount} users.`);
    }
  } catch (error) {
    console.error("Error in unbanning users:", error.message);
  }
}, 60000); // Runs every 1 minute

console.log("ML moderation & ban system initialized.");
