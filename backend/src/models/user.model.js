import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    flagged: { type: Number, default: 0, min: 0, max: 5 },
    banned: { type: Boolean, default: false },
    suspensionExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-unban after fetching user
userSchema.post("findOne", function (doc) {
  if (doc && doc.suspensionExpiresAt && new Date() > doc.suspensionExpiresAt) {
    doc.suspensionExpiresAt = null;
    doc.banned = false;
    doc.save();
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
