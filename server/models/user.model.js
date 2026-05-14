import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    provider: {
      type: String,
      enum: ["google", "github"],
      required: true,
    },
    providerId: { type: String, required: true },
    // Per-user Apify token; stored plaintext for now. Move to KMS / encrypt-at-rest later.
    apifyToken: { type: String, default: "" },
    defaultActorKey: { type: String, default: "linkedin" },
  },
  { timestamps: true },
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
