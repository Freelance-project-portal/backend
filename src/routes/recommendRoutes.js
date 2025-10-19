import express from "express";
import { getRecommendedProjects } from "../controllers/recommendController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, requireRoles(["student"]), getRecommendedProjects);

export default router;