import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js"; // Ensure socket.js is set up
import "./server.js"; // Import server.js to initialize ML & banning system

dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Log important environment variables
console.log("Starting Server...");
console.log("PORT:", PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Ensure this matches your frontend URL
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production mode
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start server and connect to DB
server.listen(PORT, async () => {
  console.log(`Server is running on PORT: ${PORT}`);
  await connectDB(); // Ensure MongoDB connection
});
