import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Store online users
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function banUser(userId) {
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit("userBanned"); // Notify user that they are banned
    io.sockets.sockets.get(socketId)?.disconnect(true); // Forcefully disconnect
    delete userSocketMap[userId]; // Remove from online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Update online users list
  }
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // **Handle Logout Event (Fixes Online Status Bug)**
  socket.on("logout", () => {
    console.log("User logged out:", userId);
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // **Handle User Disconnection**
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };
