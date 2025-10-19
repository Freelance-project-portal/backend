import express from "express";
import {
  createTask,
  getProjectTasks,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create task (faculty/business)
router.post("/", protect, requireRoles(["faculty", "business"]), createTask);

// Get all tasks of a project
router.get("/:projectId", protect, getProjectTasks);

// Update task status or add feedback
router.put("/:taskId", protect, updateTaskStatus);

export default router;
