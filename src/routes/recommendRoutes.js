import express from "express";
import { getRecommendedProjects } from "../controllers/recommendController.js";
import { protect, requireRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get recommended projects for a student
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended projects retrieved successfully
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
 *                   matchScore:
 *                     type: number
 *                     description: Relevance score based on student's skills
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a student
 */
router.get("/", protect, requireRoles(["student"]), getRecommendedProjects);

export default router;