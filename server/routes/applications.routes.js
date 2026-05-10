import { Router } from "express";
import { getApplications } from "../controllers/applications.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getApplications));

export default router;
