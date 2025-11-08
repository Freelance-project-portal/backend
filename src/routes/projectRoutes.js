import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  getMyProjects,
} from "../controllers/projectController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllProjects);
router.get("/my-projects", protect, getMyProjects);
router.get("/:id", protect, getProjectById);
router.post("/", protect, requireRoles(["faculty"]), createProject);
router.put("/:id", protect, requireRoles(["faculty"]), updateProject);

export default router;
