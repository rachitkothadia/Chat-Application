import { Server } from "socket.io";
import http from "http";
import express from "express";
import axios from "axios";
import { updateUserSuspension, isUserSuspended } from "../lib/db.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ["http://localhost:5173"] },
});

const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // **Listen for messages**
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      // ❌ 1. Check if the user is suspended
      if (await isUserSuspended(senderId)) {
        io.to(socket.id).emit("messageBlocked", { reason: "You are currently suspended." });
        return;
      }

      // ✅ 2. Send message to Python API for classification
      const response = await axios.post("http://localhost:5001/predict", { message });

      // ❌ 3. If message is inappropriate, suspend user
      if (response.data.prediction === -1) {
        console.log(`🚨 Inappropriate message detected from ${senderId}`);
        await updateUserSuspension(senderId);
        io.to(socket.id).emit("messageBlocked", { reason: "Message flagged as inappropriate. You are suspended." });
        return;
      }

      // ✅ 4. Broadcast message if it's safe
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("receiveMessage", { senderId, message });
    } catch (error) {
      console.error("Error checking message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
