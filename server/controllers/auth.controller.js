import { signToken, AUTH_COOKIE_NAME, cookieOptions } from "../utils/jwt.js";

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

export const oauthCallback = (req, res) => {
  const user = req.user;
  if (!user) {
    return res.redirect(`${clientUrl()}/login?error=oauth_failed`);
  }
  const token = signToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
  res.redirect(`${clientUrl()}/`);
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

export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
  res.status(200).json({ success: true, data: { loggedOut: true } });
};
