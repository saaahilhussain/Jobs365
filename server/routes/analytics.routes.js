import { Router } from "express";
import {
  getAnalytics,
  getDashboardStats,
  getScrapingActivity,
} from "../controllers/analytics.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getAnalytics));
router.get("/dashboard", asyncHandler(getDashboardStats));
router.get("/scraping-activity", asyncHandler(getScrapingActivity));

export default router;
