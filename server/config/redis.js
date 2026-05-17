import { createClient } from "redis";

let client = null;

export const getRedisClient = () => {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("Missing required environment variable: REDIS_URL");
    client = createClient({ url });
    client.on("error", (err) => console.error("Redis client error:", err));
  }
  return client;
};

export const connectRedis = async () => {
  const c = getRedisClient();
  if (!c.isOpen) await c.connect();
  console.log("Redis connected");
};
