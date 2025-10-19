import Task from "../models/Task.js";
import Project from "../models/Project.js";

// Create a task (faculty/business)
export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, assignedTo, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.createdBy.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({
          message: "You are not authorized to add tasks to this project.",
        });

    const task = await Task.create({
      project: projectId,
      title,
      description,
      assignedTo,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks of a project (any logged-in user)
export const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate(
      "assignedTo",
      "name email role"
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update task status (student or faculty)
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Students can update status only for their assigned tasks
    if (req.user.role === "student" && task.assignedTo.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // Faculty/business can add feedback
    if (feedback && (req.user.role === "faculty" || req.user.role === "business")) {
      task.feedback = feedback;
    }

    if (status) task.status = status;

    await task.save();

    // Update project status automatically
    const projectTasks = await Task.find({ project: task.project });
    const allDone = projectTasks.every((t) => t.status === "done");
    const someInProgress = projectTasks.some((t) => t.status === "in-progress" || t.status === "done");

    const project = await Project.findById(task.project);
    if (allDone) project.status = "completed";
    else if (someInProgress) project.status = "in-progress";
    else project.status = "open";
    await project.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};