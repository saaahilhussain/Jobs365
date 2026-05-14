import { Router } from "express";
import {
  getScraperStatus,
  syncPendingRuns,
  getJobStatus,
  getRunResults,
  pauseRun,
  rerunRun,
  completeRun,
  deleteRun,
  getActors,
} from "../controllers/scraper.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getScraperStatus));
router.get("/actors", asyncHandler(getActors));
router.get("/sync", asyncHandler(syncPendingRuns));
router.post("/:jobId/pause", asyncHandler(pauseRun));
router.post("/:jobId/rerun", asyncHandler(rerunRun));
router.post("/:jobId/complete", asyncHandler(completeRun));
router.get("/:jobId/results", asyncHandler(getRunResults));
router.get("/:jobId", asyncHandler(getJobStatus));
router.delete("/:jobId", asyncHandler(deleteRun));

export default router;
