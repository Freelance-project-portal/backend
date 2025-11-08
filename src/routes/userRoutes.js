import express from "express";
import {
  protect,
  requireRole,
  requireRoles,
} from "../middlewares/authMiddleware.js";
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "Authenticated user fetched successfully",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

router.get("/faculty/dashboard", protect, requireRole("faculty"), (req, res) => {
  res.status(200).json({
    message: `Welcome faculty`,
  });
});

router.get("/projects/manage", protect, requireRoles(["faculty"]), (req, res) => {
  res.status(200).json({
    message: `Allowed for faculty roles`,
    user: req.user,
  });
});

export default router;
