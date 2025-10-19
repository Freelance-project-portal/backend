import Project from "../models/Project.js";

// Create new project (faculty or business only)
export const createProject = async (req, res) => {
  try {
    const { title, description, skillsRequired, budget, deadline } = req.body;

    const project = await Project.create({
      title,
      description,
      skillsRequired,
      budget,
      deadline,
      createdBy: req.user._id,
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all open projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("createdBy", "name role email");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Apply to project (student only)
export const applyToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // prevent duplicate applications
    const alreadyApplied = project.applicants.find(
      (app) => app.student.toString() === req.user._id.toString()
    );
    if (alreadyApplied)
      return res.status(400).json({ message: "You have already applied to this project" });

    project.applicants.push({ student: req.user._id });
    await project.save();

    res.json({ message: "Applied successfully", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateApplicantStatus = async (req, res) => {
  try {
    const { projectId, applicantId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const project = await Project.findById(projectId).populate("createdBy", "name email role");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Ensure only faculty or business who created the project can modify applicants
    if (project.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify applicants" });
    }

    // Find the specific applicant
    const applicant = project.applicants.id(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    applicant.status = status;
    await project.save();

    res.json({
      message: `Applicant ${status} successfully`,
      applicant,
    });
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
}