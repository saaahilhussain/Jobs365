import { Router } from "express";
import { getScraperStatus } from "../controllers/scraper.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getScraperStatus));

export default router;
