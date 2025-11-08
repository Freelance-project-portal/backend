import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Application from "../models/Application.js";
import ProjectMember from "../models/ProjectMember.js";

export const getFacultyDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ faculty_id: userId });

    const totalProjects = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const draft = projects.filter((p) => p.status === "draft").length;
    const closed = projects.filter((p) => p.status === "closed").length;

    // Count pending applications
    const pendingApplications = await Application.countDocuments({
      project_id: { $in: projects.map((p) => p._id) },
      status: "pending",
    });

    // Count active students (members)
    const activeStudents = await ProjectMember.countDocuments({
      project_id: { $in: projects.map((p) => p._id) },
    });

    res.json({
      total_projects: totalProjects,
      pending_applications: pendingApplications,
      active_students: activeStudents,
      completed_projects: completed,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Count applications sent
    const applicationsSent = await Application.countDocuments({
      student_id: studentId,
    });

    // Count projects joined (memberships)
    const projectsJoined = await ProjectMember.countDocuments({
      student_id: studentId,
    });

    // Count completed tasks
    const totalTasksCompleted = await Task.countDocuments({
      assigned_to: studentId,
      status: "completed",
    });

    res.json({
      applications_sent: applicationsSent,
      projects_joined: projectsJoined,
      completed_tasks: totalTasksCompleted,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
