import jwt from "jsonwebtoken";

const TOKEN_TTL = "30d";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Set it in server/.env");
  }
  return secret;
};

export const signToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    getSecret(),
    { expiresIn: TOKEN_TTL },
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

export const AUTH_COOKIE_NAME = "jobs365_token";

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
});
