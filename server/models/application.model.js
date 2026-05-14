import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: {
      type: String,
      enum: ["saved", "applied", "assessment", "interview", "rejected", "ghosted", "offer"],
      default: "saved",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", applicationSchema);
