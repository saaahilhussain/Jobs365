import mongoose from "mongoose";

const scrapeRunSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    status: { type: String, default: "queued" },
    jobsFetched: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ScrapeRun = mongoose.model("ScrapeRun", scrapeRunSchema);
