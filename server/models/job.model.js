import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    source: { type: String, default: "unknown" },
    status: { type: String, default: "saved" },
    externalId: { type: String, default: null },
    location: { type: String, default: null },
    url: { type: String, default: null },
    raw: { type: Object, default: null },
    scrapeRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapeRun",
      default: null,
    },
    apifyRunId: { type: String, default: null },
  },
  { timestamps: true },
);

export const Job = mongoose.model("Job", jobSchema);
