import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import Suspension from "../models/suspension.model.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

// **Check authentication & suspension status**
router.get("/check", protectRoute, async (req, res) => {
  try {
    const suspension = await Suspension.findOne({ userId: req.user._id });

    if (suspension && new Date() < suspension.suspensionEndTime) {
      return res.status(403).json({
        message: "You are temporarily suspended",
        suspensionEndTime: suspension.suspensionEndTime,
      });
    }

    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth route:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
