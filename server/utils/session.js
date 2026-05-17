import { getRedisClient } from "../config/redis.js";

const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const COOKIE_NAME = "jobs365_uid";

export const cookieOptions = () => ({
  signed: true,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: TTL_SECONDS * 1000,
  path: "/",
});

const sessionKey = (userId) => `session:${userId}`;

export const createSession = async (userId) => {
  const client = getRedisClient();
  if (!client.isOpen) throw new Error("Redis client is not connected");
  const result = await client.setEx(sessionKey(userId.toString()), TTL_SECONDS, "1");
  if (result !== "OK") throw new Error(`Redis setEx failed: ${result}`);
};

export const destroySession = (userId) =>
  getRedisClient().del(sessionKey(userId.toString()));

export const sessionExists = async (userId) => {
  const val = await getRedisClient().get(sessionKey(userId.toString()));
  return val !== null;
};
