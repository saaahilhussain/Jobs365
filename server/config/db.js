import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing required environment variable: MONGO_URI");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
