import express from "express";
import {
  createTask,
  getProjectTasks,
  updateTaskStatus,
} from "../controllers/taskController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a faculty or business member
 */
router.post("/", protect, requireRoles(["faculty", "business"]), createTask);

/**
 * @swagger
 * /api/tasks/{projectId}:
 *   get:
 *     summary: Get all tasks of a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   deadline:
 *                     type: string
 *                     format: date
 *                   assignedTo:
 *                     type: object
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 */
router.get("/:projectId", protect, getProjectTasks);

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   put:
 *     summary: Update task status or add feedback
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Task not found
 */
router.put("/:taskId", protect, updateTaskStatus);

export default router;
