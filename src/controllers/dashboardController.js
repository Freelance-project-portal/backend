import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getFacultyDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ createdBy: userId }).populate("applicants.student", "name email");

    const totalProjects = projects.length;
    const open = projects.filter(p => p.status === "open").length;
    const inProgress = projects.filter(p => p.status === "in-progress").length;
    const completed = projects.filter(p => p.status === "completed").length;

    const totalApplicants = projects.reduce((sum, p) => sum + p.applicants.length, 0);
    const acceptedApplicants = projects.reduce(
      (sum, p) => sum + p.applicants.filter(a => a.status === "accepted").length,
      0
    );

    const acceptanceRate = totalApplicants ? ((acceptedApplicants / totalApplicants) * 100).toFixed(2) : 0;

    res.json({
      totalProjects,
      statusBreakdown: { open, inProgress, completed },
      totalApplicants,
      acceptedApplicants,
      acceptanceRate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const appliedProjects = await Project.find({ "applicants.student": studentId });
    const acceptedProjects = appliedProjects.filter(p =>
      p.applicants.some(a => a.student.toString() === studentId.toString() && a.status === "accepted")
    );

    const totalApplied = appliedProjects.length;
    const totalAccepted = acceptedProjects.length;

    const totalTasksCompleted = await Task.countDocuments({
      assignedTo: studentId,
      status: "done",
    });

    res.json({
      totalApplied,
      totalAccepted,
      totalTasksCompleted,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
