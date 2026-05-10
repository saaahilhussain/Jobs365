import { Router } from "express";
import { getSystemInfo } from "../controllers/system.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getSystemInfo));

export default router;
