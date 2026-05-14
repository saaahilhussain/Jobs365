import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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

// Quick win D — dedupe scraped jobs per-user, scoped to the user so two users
// can independently save the same listing.
jobSchema.index({ userId: 1, url: 1 }, { unique: true, sparse: true });

export const Job = mongoose.model("Job", jobSchema);
