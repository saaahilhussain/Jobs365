import { Router } from "express";
import passport from "passport";
import {
  oauthCallback,
  getMe,
  logout,
  registerStart,
  registerVerify,
  registerResend,
  login,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const clientLoginUrl = () =>
  `${process.env.CLIENT_URL || "http://localhost:5173"}/signin?error=oauth_failed`;

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);
router.get(
  "/google/callback",
  (req, res, next) =>
    passport.authenticate("google", {
      session: false,
      failureRedirect: clientLoginUrl(),
    })(req, res, next),
  asyncHandler(oauthCallback),
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false }),
);
router.get(
  "/github/callback",
  (req, res, next) =>
    passport.authenticate("github", {
      session: false,
      failureRedirect: clientLoginUrl(),
    })(req, res, next),
  asyncHandler(oauthCallback),
);

router.post("/register/start", asyncHandler(registerStart));
router.post("/register/verify", asyncHandler(registerVerify));
router.post("/register/resend", asyncHandler(registerResend));
router.post("/login", asyncHandler(login));

router.get("/me", requireAuth, asyncHandler(getMe));
router.post("/logout", asyncHandler(logout));

export default router;
