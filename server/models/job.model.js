import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    source: { type: String, default: "unknown" },
    status: { type: String, default: "saved" },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
