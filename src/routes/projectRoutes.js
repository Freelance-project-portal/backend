import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  getMyProjects,
} from "../controllers/projectController.js";
import {
  getProjectMembers,
  removeProjectMember,
} from "../controllers/projectMemberController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes - no authentication required
router.get("/", getAllProjects);

// Protected routes - authentication required
// IMPORTANT: Specific routes must come before parameterized routes
router.get("/my-projects", protect, getMyProjects);
router.post("/", protect, requireRoles(["faculty"]), createProject);
router.put("/:id", protect, requireRoles(["faculty"]), updateProject);

// Project members routes - must come before /:id route
router.get("/:id/members", protect, getProjectMembers);
router.delete(
  "/:id/members/:memberId",
  protect,
  requireRoles(["faculty"]),
  removeProjectMember
);

// Parameterized routes - must come after specific routes
router.get("/:id", getProjectById);

export default router;
