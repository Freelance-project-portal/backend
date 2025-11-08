import ProjectMember from "../models/ProjectMember.js";
import Project from "../models/Project.js";
import Profile from "../models/Profile.js";
import Task from "../models/Task.js";

// Get project members (faculty only)
export const getProjectMembers = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Validate ObjectId format
    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }
    
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check authorization - faculty can view their project members
    if (req.user.role === "faculty") {
      if (project.faculty_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    } else if (req.user.role === "student") {
      // Students can view members of projects they're part of
      const isMember = await ProjectMember.findOne({
        project_id: projectId,
        student_id: req.user._id,
      });
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized" });
      }
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    const members = await ProjectMember.find({ project_id: projectId })
      .populate("student_id", "email role")
      .sort({ created_at: -1 });

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const memberData = member.toObject();
        const studentProfile = await Profile.findOne({
          user_id: member.student_id,
        });

        // Get task statistics for this member
        const tasksAssigned = await Task.countDocuments({
          project_id: projectId,
          assigned_to: member.student_id,
        });

        const tasksCompleted = await Task.countDocuments({
          project_id: projectId,
          assigned_to: member.student_id,
          status: "completed",
        });

        // Format response to match frontend types
        return {
          id: memberData._id.toString(),
          project_id: memberData.project_id.toString(),
          student_id: memberData.student_id.toString(),
          student_name: studentProfile?.full_name || "Unknown",
          student_skills: studentProfile?.skills || [],
          joined_at: memberData.createdAt?.toISOString() || new Date().toISOString(),
          tasks_assigned: tasksAssigned,
          tasks_completed: tasksCompleted,
        };
      })
    );

    res.json(membersWithDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a member from a project (faculty only)
export const removeProjectMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;

    // Validate ObjectId formats
    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }
    if (!memberId || !memberId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid member ID format" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only faculty who own the project can remove members
    if (project.faculty_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const member = await ProjectMember.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Verify the member belongs to this project
    if (member.project_id.toString() !== projectId) {
      return res.status(400).json({ message: "Member does not belong to this project" });
    }

    // Remove all task assignments for this member in this project
    await Task.updateMany(
      {
        project_id: projectId,
        assigned_to: member.student_id,
      },
      {
        $unset: { assigned_to: "" },
      }
    );

    // Remove the member
    await ProjectMember.findByIdAndDelete(memberId);

    res.json({ message: "Member removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

