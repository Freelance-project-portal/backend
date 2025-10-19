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