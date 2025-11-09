import Task from "../models/Task.js";
import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";
import Profile from "../models/Profile.js";

// Create a task (faculty only)
export const createTask = async (req, res) => {
  try {
    const { project_id, title, description, assigned_to, due_date } = req.body;

    const project = await Project.findById(project_id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.faculty_id.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({
          message: "You are not authorized to add tasks to this project.",
        });

    // If assigned_to is provided, verify the student is a project member
    if (assigned_to) {
      const isMember = await ProjectMember.findOne({
        project_id,
        student_id: assigned_to,
      });
      if (!isMember) {
        return res
          .status(400)
          .json({ message: "Can only assign tasks to project members" });
      }
    }

    const task = await Task.create({
      project_id,
      title,
      description,
      assigned_to,
      due_date,
    });

    const taskData = task.toObject();
    let responseData = { ...taskData };
    if (task.assigned_to) {
      const profile = await Profile.findOne({ user_id: task.assigned_to });
      responseData.assigned_to_name = profile?.full_name;
    }

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks of a project
export const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project_id: req.params.projectId })
      .populate("assigned_to", "email role")
      .sort({ created_at: -1 });

    const tasksWithNames = await Promise.all(
      tasks.map(async (task) => {
        const taskData = task.toObject();
        let responseData = { ...taskData };
        if (task.assigned_to) {
          const profile = await Profile.findOne({ user_id: task.assigned_to });
          responseData.assigned_to_name = profile?.full_name;
        }
        return responseData;
      })
    );

    res.json(tasksWithNames);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status (kept for backward compatibility, but updateTask handles all fields)
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.taskId).populate("project_id");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project_id);

    // Students can update status only for their assigned tasks
    if (req.user.role === "student") {
      if (!task.assigned_to || task.assigned_to.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    // Faculty can update any task in their project
    if (req.user.role === "faculty") {
      if (project.faculty_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    if (status) {
      if (!["todo", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      task.status = status;
    }

    await task.save();

    // Update project status based on tasks
    const projectTasks = await Task.find({ project_id: task.project_id });
    const allCompleted = projectTasks.every((t) => t.status === "completed");
    const someInProgress = projectTasks.some(
      (t) => t.status === "in_progress" || t.status === "completed"
    );

    if (allCompleted && projectTasks.length > 0) {
      project.status = "completed";
    } else if (someInProgress) {
      project.status = "active";
    }
    await project.save();

    const taskData = task.toObject();
    let responseData = { ...taskData };
    if (task.assigned_to) {
      const profile = await Profile.findOne({ user_id: task.assigned_to });
      responseData.assigned_to_name = profile?.full_name;
    }

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task (general update for all fields)
export const updateTask = async (req, res) => {
  try {
    const { title, description, status, due_date, assigned_to } = req.body;
    const task = await Task.findById(req.params.taskId).populate("project_id");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project_id);

    // Students can only update status for their assigned tasks
    if (req.user.role === "student") {
      if (!task.assigned_to || task.assigned_to.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
      // Students can only update status, not other fields
      if (status) {
        if (!["todo", "in_progress", "completed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        task.status = status;
      }
    } else if (req.user.role === "faculty") {
      // Faculty can update all fields, but only for their own projects
      if (project.faculty_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Update title if provided
      if (title !== undefined) {
        task.title = title;
      }

      // Update description if provided
      if (description !== undefined) {
        task.description = description;
      }

      // Update status if provided
      if (status !== undefined) {
        if (!["todo", "in_progress", "completed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        task.status = status;
      }

      // Update due_date if provided
      if (due_date !== undefined) {
        // If due_date is null, empty string, or falsy, set it to null
        task.due_date = due_date && due_date.trim() !== "" ? due_date : null;
      }

      // Update assigned_to if provided
      if (assigned_to !== undefined) {
        // If assigned_to is null or empty, unassign the task
        if (!assigned_to) {
          task.assigned_to = null;
        } else {
          // Verify the student is a project member
          const isMember = await ProjectMember.findOne({
            project_id: task.project_id,
            student_id: assigned_to,
          });
          if (!isMember) {
            return res
              .status(400)
              .json({ message: "Can only assign tasks to project members" });
          }
          task.assigned_to = assigned_to;
        }
      }
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    await task.save();

    // Update project status based on tasks (if status was changed)
    if (status !== undefined) {
      const projectTasks = await Task.find({ project_id: task.project_id });
      const allCompleted = projectTasks.every((t) => t.status === "completed");
      const someInProgress = projectTasks.some(
        (t) => t.status === "in_progress" || t.status === "completed"
      );

      if (allCompleted && projectTasks.length > 0) {
        project.status = "completed";
      } else if (someInProgress) {
        project.status = "active";
      }
      await project.save();
    }

    const taskData = task.toObject();
    let responseData = { ...taskData };
    if (task.assigned_to) {
      const profile = await Profile.findOne({ user_id: task.assigned_to });
      responseData.assigned_to_name = profile?.full_name;
    }

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task assignment
export const updateTaskAssignment = async (req, res) => {
  try {
    const { assigned_to } = req.body;
    const task = await Task.findById(req.params.taskId).populate("project_id");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project_id);

    // Only faculty can assign tasks
    if (project.faculty_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Verify the student is a project member
    if (assigned_to) {
      const isMember = await ProjectMember.findOne({
        project_id: task.project_id,
        student_id: assigned_to,
      });
      if (!isMember) {
        return res
          .status(400)
          .json({ message: "Can only assign tasks to project members" });
      }
    }

    task.assigned_to = assigned_to || null;
    await task.save();

    const taskData = task.toObject();
    let responseData = { ...taskData };
    if (task.assigned_to) {
      const profile = await Profile.findOne({ user_id: task.assigned_to });
      responseData.assigned_to_name = profile?.full_name;
    }

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a task (faculty only)
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("project_id");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project_id);

    // Only faculty who own the project can delete tasks
    if (project.faculty_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const projectId = task.project_id.toString();
    await Task.findByIdAndDelete(req.params.taskId);

    res.json({ message: "Task deleted successfully", project_id: projectId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};