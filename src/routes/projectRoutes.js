import express from "express";
import {
  createProject,
  getAllProjects,
  applyToProject,
} from "../controllers/projectController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all projects
router.get("/", protect, getAllProjects);

// Faculty or business can create project
router.post("/", protect, requireRoles(["faculty", "business"]), createProject);

// Student applies to project
router.post("/:id/apply", protect, requireRoles(["student"]), applyToProject);

export default router;
