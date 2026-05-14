import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/user.model.js";

const upsertUser = async ({ provider, providerId, email, name, avatarUrl }) => {
  if (!email) {
    throw new Error(`OAuth provider '${provider}' returned no email`);
  }
  const update = {
    provider,
    providerId,
    email: email.toLowerCase(),
    name: name || "",
    avatarUrl: avatarUrl || "",
  };
  return User.findOneAndUpdate({ provider, providerId }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
};

const apiBase = () => process.env.API_BASE_URL || "http://localhost:5000";

export const configurePassport = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${apiBase()}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await upsertUser({
              provider: "google",
              providerId: profile.id,
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (err) {
            done(err);
          }
        },
      ),
    );
  } else {
    console.warn("Google OAuth not configured (missing env vars)");
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: `${apiBase()}/api/auth/github/callback`,
          scope: ["user:email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // GitHub may not return email in profile if user has it private; fall back to first verified one
            const email =
              profile.emails?.find((e) => e.verified)?.value ||
              profile.emails?.[0]?.value;
            const user = await upsertUser({
              provider: "github",
              providerId: profile.id,
              email,
              name: profile.displayName || profile.username,
              avatarUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (err) {
            done(err);
          }
        },
      ),
    );
  } else {
    console.warn("GitHub OAuth not configured (missing env vars)");
  }
};
