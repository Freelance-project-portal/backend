import express from "express";
import {
  getStudentDashboard,
  getFacultyDashboard,
} from "../controllers/dashboardController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/faculty",
  protect,
  requireRoles(["business", "faculty"]),
  getFacultyDashboard
);

router.get("/student", protect, requireRoles(["student"]), getStudentDashboard);

export default router;
