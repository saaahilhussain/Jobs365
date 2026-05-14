import mongoose from "mongoose";

const scrapeRunSchema = new mongoose.Schema(
  {
    apifyRunId: { type: String },
    datasetId: { type: String },
    actorKey: { type: String, default: "linkedin" },
    query: { type: String, default: "software engineer" },
    location: { type: String, default: "remote" },
    limit: { type: Number, default: 20 },
    runBudgetSecs: { type: Number, default: 60 },
    resumedFromRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapeRun",
      default: null,
    },
    stopReason: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    status: { type: String, default: "queued" },
    jobsFetched: { type: Number, default: 0 },
    syncedItems: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const ScrapeRun = mongoose.model("ScrapeRun", scrapeRunSchema);
