import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

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

    // Check if user is banned
    if (user.isBanned) {
      if (user.suspensionExpiresAt && new Date() > user.suspensionExpiresAt) {
        // Auto-unban if suspension period has expired
        user.isBanned = false;
        user.suspensionExpiresAt = null;
        await user.save();
      } else {
        return res.status(403).json({ message: "You are banned from accessing this service." });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
