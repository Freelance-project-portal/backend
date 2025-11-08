import express from "express";
import {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  updateTaskAssignment,
} from "../controllers/taskController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, requireRoles(["faculty"]), createTask);
router.get("/:projectId", protect, getProjectTasks);
router.put("/:taskId", protect, updateTaskStatus);
router.put("/:taskId/assign", protect, requireRoles(["faculty"]), updateTaskAssignment);

export default router;
