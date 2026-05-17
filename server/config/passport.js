import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import passportGitHub from "passport-github2";
import { User } from "../models/user.model.js";

const GoogleStrategy = passportGoogle.Strategy;
const GitHubStrategy = passportGitHub.Strategy;

const upsertUser = async ({ provider, providerId, email, name, avatarUrl }) => {
  if (!email) {
    throw new Error(`OAuth provider '${provider}' returned no email`);
  }
  const normalizedEmail = email.toLowerCase();

  // 1) Same provider account exists — update and return.
  const sameProvider = await User.findOne({ provider, providerId });
  if (sameProvider) {
    sameProvider.email = normalizedEmail;
    sameProvider.name = name || sameProvider.name;
    sameProvider.avatarUrl = avatarUrl || sameProvider.avatarUrl;
    await sameProvider.save();
    return sameProvider;
  }

  // 2) Different account already owns this email (e.g. email/password signup,
  // or the other OAuth provider). Sign them into the existing account — the
  // user owns the inbox, so this is safe. We don't overwrite their original
  // provider/providerId, so the original login method keeps working.
  const sameEmail = await User.findOne({ email: normalizedEmail });
  if (sameEmail) {
    if (name && !sameEmail.name) sameEmail.name = name;
    if (avatarUrl && !sameEmail.avatarUrl) sameEmail.avatarUrl = avatarUrl;
    await sameEmail.save();
    return sameEmail;
  }

  // 3) Brand new — create.
  return User.create({
    provider,
    providerId,
    email: normalizedEmail,
    name: name || "",
    avatarUrl: avatarUrl || "",
  });
};

const apiBase = () => process.env.API_BASE_URL || "http://localhost:5000";

export const configurePassport = () => {
  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

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
