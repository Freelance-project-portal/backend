import Project from "../models/Project.js";
import Application from "../models/Application.js";
import ProjectMember from "../models/ProjectMember.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/notificationService.js";

// Create new project (faculty only)
export const createProject = async (req, res) => {
  try {
    const { title, description, requirements, skills, max_students, deadline } = req.body;

    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can create projects" });
    }

    const project = await Project.create({
      title,
      description,
      requirements,
      skills: skills || [],
      max_students: max_students || 1,
      deadline,
      faculty_id: req.user._id,
      status: "draft",
    });

    const facultyProfile = await Profile.findOne({ user_id: req.user._id });
    const projectData = project.toObject();
    projectData.faculty_name = facultyProfile?.full_name;

    res.status(201).json(projectData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all projects (with filtering)
export const getAllProjects = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate("faculty_id", "email role")
      .sort({ created_at: -1 });

    // Get faculty profiles and member counts
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const projectData = project.toObject();
        const facultyProfile = await Profile.findOne({ user_id: project.faculty_id });
        projectData.faculty_name = facultyProfile?.full_name;

        // Count current students
        const memberCount = await ProjectMember.countDocuments({
          project_id: project._id,
        });
        projectData.current_students = memberCount;

        return projectData;
      })
    );

    res.json(projectsWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "faculty_id",
      "email role"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const projectData = project.toObject();
    const facultyProfile = await Profile.findOne({ user_id: project.faculty_id });
    projectData.faculty_name = facultyProfile?.full_name;

    const memberCount = await ProjectMember.countDocuments({
      project_id: project._id,
    });
    projectData.current_students = memberCount;

    res.json(projectData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update project (faculty only)
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.faculty_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }

    const { title, description, requirements, skills, max_students, deadline, status } =
      req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (requirements) project.requirements = requirements;
    if (skills) project.skills = skills;
    if (max_students !== undefined) project.max_students = max_students;
    if (deadline) project.deadline = deadline;
    if (status) project.status = status;

    await project.save();

    const projectData = project.toObject();
    const facultyProfile = await Profile.findOne({ user_id: project.faculty_id });
    projectData.faculty_name = facultyProfile?.full_name;

    res.json(projectData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my projects
export const getMyProjects = async (req, res) => {
  try {
    const user = req.user;
    let projects;

    if (user.role === "student") {
      // Get projects where student is a member
      const memberships = await ProjectMember.find({ student_id: user._id });
      const projectIds = memberships.map((m) => m.project_id);

      projects = await Project.find({ _id: { $in: projectIds } })
        .populate("faculty_id", "email role")
        .sort({ created_at: -1 });
    } else if (user.role === "faculty") {
      projects = await Project.find({ faculty_id: user._id })
        .populate("faculty_id", "email role")
        .sort({ created_at: -1 });
    } else {
      return res.status(403).json({ message: "Invalid role for this request" });
    }

    // Add faculty names and member counts
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const projectData = project.toObject();
        const facultyProfile = await Profile.findOne({ user_id: project.faculty_id });
        projectData.faculty_name = facultyProfile?.full_name;

        const memberCount = await ProjectMember.countDocuments({
          project_id: project._id,
        });
        projectData.current_students = memberCount;

        return projectData;
      })
    );

    res.json(projectsWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
