import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { PendingRegistration } from "../models/pendingRegistration.model.js";
import { sendOtpEmail } from "../services/email.service.js";
import {
  COOKIE_NAME,
  cookieOptions,
  createSession,
  destroySession,
} from "../utils/session.js";

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () => {
  // 6-digit zero-padded, uniform via rejection sampling
  const buf = crypto.randomBytes(4);
  const n = buf.readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, "0");
};

const hashOtp = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const issueSession = async (res, user) => {
  await createSession(user._id);
  res.cookie(COOKIE_NAME, user._id.toString(), cookieOptions());
};

export const oauthCallback = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.redirect(`${clientUrl()}/signin?error=oauth_failed`);
  }
  await issueSession(res, user);
  res.redirect(`${clientUrl()}/app`);
};

export const getMe = async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      hasApifyToken: Boolean(user.apifyToken),
      defaultActorKey: user.defaultActorKey,
    },
  });
};

export const logout = async (req, res) => {
  const userId = req.signedCookies?.[COOKIE_NAME];
  if (userId) await destroySession(userId);
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(200).json({ success: true, data: { loggedOut: true } });
};

export const registerStart = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = (req.body?.name || "").trim();
  const password = req.body?.password || "";

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter a valid email." });
  }
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateOtp();
  const otpHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await PendingRegistration.findOneAndUpdate(
    { email },
    { email, name, passwordHash, otpHash, expiresAt, attempts: 0 },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  await sendOtpEmail({ to: email, code, name });

  res.status(200).json({
    success: true,
    data: { email, expiresInSeconds: OTP_TTL_MS / 1000 },
  });
};

export const registerVerify = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = (req.body?.code || "").trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email or code." });
  }

  const pending = await PendingRegistration.findOne({ email });
  if (!pending) {
    return res.status(404).json({
      success: false,
      message: "No pending registration. Start over.",
    });
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    return res
      .status(410)
      .json({ success: false, message: "Code expired. Start over." });
  }

  if (pending.attempts >= MAX_OTP_ATTEMPTS) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Start over.",
    });
  }

  if (hashOtp(code) !== pending.otpHash) {
    pending.attempts += 1;
    await pending.save();
    return res
      .status(400)
      .json({ success: false, message: "Incorrect code." });
  }

  const user = await User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        email,
        name: pending.name,
        provider: "email",
        providerId: email,
        passwordHash: pending.passwordHash,
        emailVerified: true,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  await PendingRegistration.deleteOne({ _id: pending._id });

  await issueSession(res, user);
  res.status(200).json({
    success: true,
    data: { id: user._id, email: user.email, name: user.name },
  });
};

export const registerResend = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email." });
  }
  const pending = await PendingRegistration.findOne({ email });
  if (!pending) {
    return res.status(404).json({
      success: false,
      message: "No pending registration. Start over.",
    });
  }

  const code = generateOtp();
  pending.otpHash = hashOtp(code);
  pending.expiresAt = new Date(Date.now() + OTP_TTL_MS);
  pending.attempts = 0;
  await pending.save();

  await sendOtpEmail({ to: email, code, name: pending.name });

  res.status(200).json({
    success: true,
    data: { email, expiresInSeconds: OTP_TTL_MS / 1000 },
  });
};

export const login = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password || "";

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const user = await User.findOne({ email });
  if (!user || user.provider !== "email" || !user.passwordHash) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }

  await issueSession(res, user);
  res.status(200).json({
    success: true,
    data: { id: user._id, email: user.email, name: user.name },
  });
};
