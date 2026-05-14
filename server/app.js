import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { connectDB } from "./config/db.js";
import { configurePassport } from "./config/passport.js";
import { registerScrapeJobsCron } from "./cron/scrapeJobs.cron.js";
import authRoutes from "./routes/auth.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import scraperRoutes from "./routes/scraper.routes.js";
import systemRoutes from "./routes/system.routes.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

configurePassport();
app.use(passport.initialize());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

// Everything below requires a logged-in user.
app.use("/api/jobs", requireAuth, jobsRoutes);
app.use("/api/applications", requireAuth, applicationsRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/scraper", requireAuth, scraperRoutes);
app.use("/api/system", requireAuth, systemRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const startServer = async () => {
  await connectDB();
  registerScrapeJobsCron();
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
