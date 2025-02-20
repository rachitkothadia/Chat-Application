import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Suspension from "../models/suspension.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is permanently banned
    if (user.banned) {
      return res.status(403).json({ message: "Access Denied - You are permanently banned" });
    }

    // Check if user is temporarily suspended
    const suspension = await Suspension.findOne({ userId: user._id });

    if (suspension && new Date() < suspension.suspensionEndTime) {
      return res.status(403).json({
        message: "Access Denied - You are temporarily suspended",
        suspensionEndTime: suspension.suspensionEndTime,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
