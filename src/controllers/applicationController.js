import Application from "../models/Application.js";
import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/notificationService.js";

// Apply to project (student only)
export const applyToProject = async (req, res) => {
  try {
    const student = req.user;
    const { project_id, cover_letter, resume_url } = req.body;

    if (student.role !== "student") {
      return res.status(403).json({ message: "Only students can apply to projects" });
    }

    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if project is accepting applications
    if (project.status !== "active" && project.status !== "draft") {
      return res.status(400).json({ message: "Project is not accepting applications" });
    }

    // Check how many active projects this student already has
    const activeMemberships = await ProjectMember.find({ student_id: student._id });
    const activeProjectIds = activeMemberships.map((m) => m.project_id);
    const activeProjects = await Project.find({
      _id: { $in: activeProjectIds },
      status: "active",
    });

    if (activeProjects.length >= 3) {
      return res.status(400).json({
        message:
          "You already have 3 active projects. Complete one before applying to a new one.",
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      project_id,
      student_id: student._id,
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied to this project" });
    }

    // Create application
    const application = await Application.create({
      project_id,
      student_id: student._id,
      cover_letter,
      resume_url,
      status: "pending",
    });

    const applicationData = application.toObject();
    const studentProfile = await Profile.findOne({ user_id: student._id });
    const studentUser = await User.findById(student._id);

    applicationData.student_name = studentProfile?.full_name;
    applicationData.student_email = studentUser?.email;
    applicationData.student_skills = studentProfile?.skills || [];

    res.status(201).json(applicationData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get applications for a project (faculty only)
export const getProjectApplications = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.faculty_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applications = await Application.find({ project_id: projectId })
      .populate("student_id", "email role")
      .sort({ created_at: -1 });

    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const appData = app.toObject();
        const studentProfile = await Profile.findOne({ user_id: app.student_id });
        const studentUser = await User.findById(app.student_id);

        appData.student_name = studentProfile?.full_name;
        appData.student_email = studentUser?.email;
        appData.student_skills = studentProfile?.skills || [];

        return appData;
      })
    );

    res.json(applicationsWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get my applications (student only)
export const getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view their applications" });
    }

    const applications = await Application.find({ student_id: req.user._id })
      .populate("project_id")
      .sort({ created_at: -1 });

    const applicationsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const appData = app.toObject();
        const studentProfile = await Profile.findOne({ user_id: app.student_id });
        const studentUser = await User.findById(app.student_id);

        appData.student_name = studentProfile?.full_name;
        appData.student_email = studentUser?.email;
        appData.student_skills = studentProfile?.skills || [];

        // Add project details
        if (app.project_id) {
          const project = await Project.findById(app.project_id);
          const facultyProfile = await Profile.findOne({ user_id: project.faculty_id });
          const projectData = project.toObject();
          projectData.faculty_name = facultyProfile?.full_name;
          appData.project = projectData;
        }

        return appData;
      })
    );

    res.json(applicationsWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update application status (faculty only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(applicationId).populate("project_id");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const project = await Project.findById(application.project_id);
    if (project.faculty_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if already processed
    if (application.status !== "pending") {
      return res.status(400).json({ message: "Application has already been processed" });
    }

    if (status === "accepted") {
      // Check max students limit
      const currentMembers = await ProjectMember.countDocuments({
        project_id: application.project_id,
      });

      if (currentMembers >= project.max_students) {
        return res.status(400).json({ message: "Project has reached maximum students" });
      }

      // Check student's active projects limit
      const activeMemberships = await ProjectMember.find({ student_id: application.student_id });
      const activeProjectIds = activeMemberships.map((m) => m.project_id);
      const activeProjects = await Project.find({
        _id: { $in: activeProjectIds },
        status: "active",
      });

      if (activeProjects.length >= 3) {
        const studentProfile = await Profile.findOne({ user_id: application.student_id });
        return res.status(400).json({
          message: `${studentProfile?.full_name || "Student"} already has 3 active projects.`,
        });
      }

      // Add student as project member
      await ProjectMember.create({
        project_id: application.project_id,
        student_id: application.student_id,
      });

      // Update project status to active if it was draft
      if (project.status === "draft") {
        project.status = "active";
        await project.save();
      }
    }

    application.status = status;
    await application.save();

    // Send email notification
    const studentUser = await User.findById(application.student_id);
    const studentProfile = await Profile.findOne({ user_id: application.student_id });

    if (studentUser?.email) {
      const subject =
        status === "accepted"
          ? `🎉 Congratulations! Your application is accepted`
          : `❌ Update on your application`;

      const message =
        status === "accepted"
          ? `Hello ${studentProfile?.full_name || "Student"},\n\nYou have been accepted for the project "${project.title}". Please check your dashboard for details and next steps.`
          : `Hello ${studentProfile?.full_name || "Student"},\n\nWe regret to inform you that your application for the project "${project.title}" has been rejected. Better luck next time!`;

      await sendEmail(studentUser.email, subject, message);
    }

    const applicationData = application.toObject();
    applicationData.student_name = studentProfile?.full_name;
    applicationData.student_email = studentUser?.email;
    applicationData.student_skills = studentProfile?.skills || [];

    res.json({
      message: `Application ${status} successfully`,
      application: applicationData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

