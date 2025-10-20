import express from "express";
import {
  protect,
  requireRole,
  requireRoles,
} from "../middlewares/authMiddleware.js";
import { updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get logged-in user details
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Not authorized
 */
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    message: "Authenticated user fetched successfully",
    user: req.user,
  });
});

/**
 * @swagger
 * /api/user/faculty/dashboard:
 *   get:
 *     summary: Get faculty dashboard
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Faculty dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a faculty member
 */
router.get("/faculty/dashboard", protect, requireRole("faculty"), (req, res) => {
  res.status(200).json({
    message: `Welcome faculty ${req.user.name}`,
  });
});

/**
 * @swagger
 * /api/user/projects/manage:
 *   get:
 *     summary: Get project management dashboard
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project management data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a faculty or business member
 */
router.get("/projects/manage", protect, requireRoles(["faculty", "business"]), (req, res) => {
  res.status(200).json({
    message: `Allowed for faculty or business roles`,
    user: req.user,
  });
});

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a student
 */
router.put("/profile", protect, requireRoles(["student"]), updateUserProfile);

export default router;
