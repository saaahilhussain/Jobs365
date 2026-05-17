import { User } from "../models/user.model.js";
import { COOKIE_NAME, sessionExists } from "../utils/session.js";

export const requireAuth = async (req, res, next) => {
  try {
    const userId = req.signedCookies?.[COOKIE_NAME];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const active = await sessionExists(userId);
    if (!active) {
      return res.status(401).json({ success: false, message: "Session expired" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
};
