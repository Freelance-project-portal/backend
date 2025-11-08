import Project from "../models/Project.js";
import Application from "../models/Application.js";
import ProjectMember from "../models/ProjectMember.js";
import Profile from "../models/Profile.js";
import { matchProjectsToStudent } from "../utils/aiMatcher.js";

export const getRecommendedProjects = async (req, res) => {
  try {
    const student = req.user;
    const studentId = student._id;

    // Get student profile for skills matching
    const studentProfile = await Profile.findOne({ user_id: studentId });

    // Get projects that are active or draft
    const allProjects = await Project.find({
      status: { $in: ["active", "draft"] },
    });

    // Get project IDs where student has already applied
    const appliedProjectIds = (
      await Application.find({ student_id: studentId })
    ).map((app) => app.project_id.toString());

    // Get project IDs where student is already a member
    const memberProjectIds = (
      await ProjectMember.find({ student_id: studentId })
    ).map((member) => member.project_id.toString());

    // Filter out projects student has already applied to or joined
    const availableProjects = allProjects.filter(
      (project) =>
        !appliedProjectIds.includes(project._id.toString()) &&
        !memberProjectIds.includes(project._id.toString())
    );

    const recommendations = matchProjectsToStudent(availableProjects, studentProfile);

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
