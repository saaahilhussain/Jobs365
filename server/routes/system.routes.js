import { Router } from "express";
import {
  getSystemInfo,
  updateSettings,
  testApifyToken,
} from "../controllers/system.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getSystemInfo));
router.put("/settings", asyncHandler(updateSettings));
router.post("/test-apify-token", asyncHandler(testApifyToken));

export default router;
