import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import jobsRoutes from "./routes/jobs.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import scraperRoutes from "./routes/scraper.routes.js";
import systemRoutes from "./routes/system.routes.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/scraper", scraperRoutes);
app.use("/api/system", systemRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

startServer();
