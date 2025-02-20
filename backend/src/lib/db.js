import mongoose from "mongoose";
import User from "../models/user.model.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};

// Function to update user suspension
export const updateUserSuspension = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.flagCount = (user.flagCount || 0) + 1; // Increase flag count

    // Define suspension durations
    const suspensionDurations = [0, 5 * 60, 60 * 60, 5 * 60 * 60, 24 * 60 * 60, "PERM"];
    const suspensionTime = suspensionDurations[user.flagCount] || "PERM";

    if (suspensionTime === "PERM") {
      user.banned = true;
      console.log(`🚨 User ${userId} permanently banned.`);
    } else {
      user.suspensionExpiresAt = new Date(Date.now() + suspensionTime * 1000);
      console.log(`⚠️ User ${userId} suspended for ${suspensionTime / 60} min.`);
    }

    await user.save();
  } catch (error) {
    console.error("Error updating user suspension:", error);
  }
};

// Function to check if a user is currently suspended
export const isUserSuspended = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    if (user.banned) return true;

    if (user.suspensionExpiresAt && new Date() < user.suspensionExpiresAt) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking user suspension:", error);
    return false;
  }
};
