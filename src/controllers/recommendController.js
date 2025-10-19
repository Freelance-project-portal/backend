import Project from "../models/Project.js";
import { matchProjectsToStudent } from "../utils/aiMatcher.js";

export const getRecommendedProjects = async (req, res) => {
  try {
    const student = req.user; // You’ll need the full object for matching
    const studentId = student._id;

    const projects = await Project.find({
      status: { $in: ["open", "in-progress"] }, // ✅ Allow both open & in-progress
      "applicants.student": { $ne: studentId }, // ✅ Exclude already applied/joined
    });

    const recommendations = matchProjectsToStudent(projects, student);

    res.json(
      recommendations.map((r) => ({
        project: r.project,
        score: r.matchScore.toFixed(2),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
