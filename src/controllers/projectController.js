import Project from "../models/Project.js";
import { sendEmail } from "../utils/notificationService.js";

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
    const projects = await Project.find().populate(
      "createdBy",
      "name role email"
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Apply to project (student only)
export const applyToProject = async (req, res) => {
  try {
    const student = req.user; // from middleware
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check if user is a student
    if (student.role !== "student")
      return res
        .status(403)
        .json({ message: "Only students can apply to projects" });

    // Check how many accepted projects this student already has
    const acceptedProjects = await Project.find({
      "applicants.student": student._id,
      "applicants.status": "accepted",
    });

    if (acceptedProjects.length >= 3) {
      return res.status(400).json({
        message:
          "You already have 3 active projects. Complete one before applying to a new one.",
      });
    }

    // Prevent duplicate application
    const alreadyApplied = project.applicants.find(
      (app) => app.student.toString() === student._id.toString()
    );
    if (alreadyApplied)
      return res
        .status(400)
        .json({ message: "You have already applied to this project" });

    // Push new applicant
    project.applicants.push({ student: student._id });
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

    const project = await Project.findById(projectId)
      .populate("createdBy", "name email role")
      .populate("applicants.student", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Ensure only faculty or business who created the project can modify applicants
    if (project.createdBy._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify applicants" });
    }

    // Find the specific applicant
    const applicant = project.applicants.id(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    if (status === "accepted") {
      const activeProjects = await Project.find({
        "applicants.student": applicant.student._id,
        "applicants.status": "accepted",
      });

      if (activeProjects.length >= 3) {
        return res.status(400).json({
          message: `${applicant.student.name} already has 3 active projects.`,
        });
      }
    }

    applicant.status = status;
    await project.save();

    if (applicant.student?.email) {
      const subject =
        status === "accepted"
          ? `🎉 Congratulations! Your application is accepted`
          : `❌ Update on your application`;

      const message =
        status === "accepted"
          ? `Hello ${applicant.student.name},\n\nYou have been accepted for the project "${project.title}". Please check your dashboard for details and next steps.`
          : `Hello ${applicant.student.name},\n\nWe regret to inform you that your application for the project "${project.title}" has been rejected. Better luck next time!`;

      await sendEmail(applicant.student.email, subject, message);
    }

    res.json({
      message: `Applicant ${status} successfully`,
      applicant,
    });
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const user = req.user;
    let projects;

    if (user.role === "student") {
      projects = await Project.find({ "applicants.student": user._id })
        .populate("createdBy", "name role email")
        .populate("applicants.student", "name email");
    } else if (user.role === "faculty" || user.role === "business") {
      projects = await Project.find({ createdBy: user._id })
        .populate("applicants.student", "name email")
        .populate("createdBy", "name role email");
    } else {
      return res.status(403).json({ message: "Invalid role for this request" });
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
};
