import { Router } from "express";
import {
  getScraperStatus,
  syncPendingRuns,
  getJobStatus,
  getRunResults,
  pauseRun,
  resumeRun,
} from "../controllers/scraper.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getScraperStatus));
router.get("/sync", asyncHandler(syncPendingRuns));
router.post("/:jobId/pause", asyncHandler(pauseRun));
router.post("/:jobId/resume", asyncHandler(resumeRun));
router.get("/:jobId/results", asyncHandler(getRunResults));
router.get("/:jobId", asyncHandler(getJobStatus));

export default router;
