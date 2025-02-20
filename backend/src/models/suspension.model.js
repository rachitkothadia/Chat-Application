import mongoose from "mongoose";

const suspensionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    suspensionLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Suspension = mongoose.model("Suspension", suspensionSchema);
export default Suspension;
