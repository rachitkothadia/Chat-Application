import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { suspendUser } from "../controllers/auth.controller.js";

const router = express.Router(); // ✅ Define router

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/suspend/:id", suspendUser);
router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
