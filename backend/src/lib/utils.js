import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/user.model.js"; 

const ML_API_URL = process.env.ML_API_URL || "https://your-ml-api.onrender.com/predict";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return token;
};

export async function checkMessageWithML(text) {
  try {
    const response = await axios.post(ML_API_URL, { message: text });
    return response.data.prediction === -1;
  } catch (error) {
    return false;
  }
}

export async function updateBanStatus(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return 0;

    user.flagged += 1;

    let banDuration;
    switch (user.flagged) {
      case 1:
        banDuration = 5;
        break;
      case 2:
        banDuration = 60;
        break;
      case 3:
        banDuration = 300;
        break;
      case 4:
        banDuration = 1440;
        break;
      default:
        banDuration = -1;
    }

    if (banDuration === -1) {
      user.banned = true;
    } else {
      user.bannedUntil = new Date(Date.now() + banDuration * 60 * 1000);
    }

    await user.save();
    return banDuration;
  } catch (error) {
    return 0;
  }
}
