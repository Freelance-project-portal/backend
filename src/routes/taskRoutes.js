import express from "express";
import {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  updateTask,
  updateTaskAssignment,
  deleteTask,
} from "../controllers/taskController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, requireRoles(["faculty"]), createTask);
router.get("/:projectId", protect, getProjectTasks);
router.put("/:taskId", protect, updateTask);
router.put("/:taskId/status", protect, updateTaskStatus);
router.put("/:taskId/assign", protect, requireRoles(["faculty"]), updateTaskAssignment);
router.delete("/:taskId", protect, requireRoles(["faculty"]), deleteTask);

export default router;
