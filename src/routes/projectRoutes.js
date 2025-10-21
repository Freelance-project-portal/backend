import express from "express";
import {
  createProject,
  getAllProjects,
  applyToProject,
  updateApplicantStatus,
  getMyProjects,
} from "../controllers/projectController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter projects by status (open, in-progress, completed)
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
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
 *                   createdBy:
 *                     type: object
 *                   applicants:
 *                     type: array
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, getAllProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
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
 *               - skillsRequired
 *               - budget
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               budget:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Project created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a faculty or business member
 */
router.post("/", protect, requireRoles(["faculty", "business"]), createProject);

/**
 * @swagger
 * /api/projects/{id}/apply:
 *   post:
 *     summary: Apply to a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a student
 *       404:
 *         description: Project not found
 */
router.post("/:id/apply", protect, requireRoles(["student"]), applyToProject);

/**
 * @swagger
 * /api/projects/{projectId}/applicants/{applicantId}:
 *   put:
 *     summary: Update applicant status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: applicantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Applicant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected, pending]
 *     responses:
 *       200:
 *         description: Applicant status updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a faculty or business member
 *       404:
 *         description: Project or applicant not found
 */
router.put(
  "/:projectId/applicants/:applicantId",
  protect,
  requireRoles(["faculty", "business"]),
  updateApplicantStatus
);

/**
 * @swagger
 * /api/projects/my-projects:
 *   get:
 *     summary: Get my projects as a faculty or business member
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get("/my-projects", protect, getMyProjects);

export default router;
