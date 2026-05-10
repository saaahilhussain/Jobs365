import { Router } from "express";
import { getJobs } from "../controllers/jobs.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getJobs));

export default router;
