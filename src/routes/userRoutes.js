import express from "express";
import {
  protect,
  requireRole,
  requireRoles,
} from "../middlewares/authMiddleware.js";
import { updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

// --- Get logged-in user details (protected for all users)
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "Authenticated user fetched successfully",
    user: req.user,
  });
});

// --- Faculty dashboard (faculty-only)
router.get("/faculty/dashboard", protect, requireRole("faculty"), (req, res) => {
  res.status(200).json({
    message: `Welcome faculty ${req.user.name}`,
  });
});

// --- Project management (faculty + business)
router.get("/projects/manage", protect, requireRoles(["faculty", "business"]), (req, res) => {
  res.status(200).json({
    message: `Allowed for faculty or business roles`,
    user: req.user,
  });
});

// --- Update user profile
router.put("/profile", protect, requireRoles(["student"]), updateUserProfile);

export default router;
