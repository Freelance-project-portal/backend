// cronJobs/deadlineChecker.js
import cron from "node-cron";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import ProjectMember from "../models/ProjectMember.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/notificationService.js";

// 🕛 Run every midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running daily project & task deadline check...");

  const today = new Date();
  const twoDaysAhead = new Date();
  twoDaysAhead.setDate(today.getDate() + 2);

  // --------------------------------------------------
  // 🔹 1. PROJECT DEADLINE REMINDERS
  // --------------------------------------------------
  const projects = await Project.find({
    deadline: { $lte: twoDaysAhead, $gte: today },
    status: { $in: ["active", "draft"] },
  }).populate("faculty_id", "email");

  for (const project of projects) {
    const message = `📢 Reminder: The project "${
      project.title
    }" is due on ${project.deadline.toDateString()}. Please ensure all tasks and submissions are completed.`;

    // Notify the creator (faculty)
    const facultyUser = await User.findById(project.faculty_id);
    if (facultyUser?.email) {
      await sendEmail(
        facultyUser.email,
        "Project Deadline Approaching",
        message
      );
    }

    // Notify project members (students)
    const members = await ProjectMember.find({ project_id: project._id });
    for (const member of members) {
      const studentUser = await User.findById(member.student_id);
      if (studentUser?.email) {
        await sendEmail(
          studentUser.email,
          "Project Deadline Reminder",
          message
        );
      }
    }
  }

  // --------------------------------------------------
  // 🔹 2. TASK DEADLINE REMINDERS
  // --------------------------------------------------
  const tasks = await Task.find({
    due_date: { $lte: twoDaysAhead, $gte: today },
  })
    .populate("assigned_to", "email")
    .populate({
      path: "project_id",
      populate: { path: "faculty_id", select: "email" },
    });

  for (const task of tasks) {
    const taskMessage = `🕓 Reminder: The task "${task.title}" under project "${
      task.project_id.title
    }" is due on ${task.due_date.toDateString()}. Please complete it on time.`;

    // Notify assigned student
    if (task.assigned_to) {
      const assignedUser = await User.findById(task.assigned_to);
      if (assignedUser?.email) {
        await sendEmail(
          assignedUser.email,
          "Task Deadline Approaching",
          taskMessage
        );
      }
    }

    // Notify the faculty who created the project
    const project = await Project.findById(task.project_id._id);
    if (project?.faculty_id) {
      const facultyUser = await User.findById(project.faculty_id);
      if (facultyUser?.email) {
        await sendEmail(
          facultyUser.email,
          "Task Deadline Reminder (Student Task)",
          taskMessage
        );
      }
    }
  }

  console.log("✅ Daily deadline check completed.");
});
