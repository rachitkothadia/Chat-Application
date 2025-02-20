import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    flagged: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    banned: {
      type: Boolean,
      default: false,
    },
    suspensionExpiresAt: {
      type: Date,
      default: null, // Stores when the suspension ends
    },
  },
  { timestamps: true }
);

// Auto-unban middleware: Runs before fetching a user
userSchema.pre("findOne", function (next) {
  if (this.suspensionExpiresAt && new Date() > this.suspensionExpiresAt) {
    this.suspensionExpiresAt = null;
    this.banned = false;
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
