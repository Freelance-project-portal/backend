import express from "express";
import {
  applyToProject,
  getProjectApplications,
  getMyApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Student routes
router.post("/", protect, requireRoles(["student"]), applyToProject);
router.get("/my-applications", protect, requireRoles(["student"]), getMyApplications);

// Faculty routes
router.get("/project/:projectId", protect, requireRoles(["faculty"]), getProjectApplications);
router.put("/:applicationId/status", protect, requireRoles(["faculty"]), updateApplicationStatus);

export default router;

