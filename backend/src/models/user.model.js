import mongoose from "mongoose"; // ✅ Correct for ES Modules


const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilepic: { type: String, default: "" },
  flagged: { type: Number, default: 0 },
  banned: { type: Boolean, default: false },  // 🚀 Set banned field with default false
  suspensionexpireat: { type: Date, default: null },
  createdat: { type: Date, default: Date.now },
  updatedat: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
