// cronJobs/deadlineChecker.js
import cron from "node-cron";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
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
  })
    .populate("createdBy")
    .populate("applicants.student");

  for (const project of projects) {
    const message = `📢 Reminder: The project "${
      project.title
    }" is due on ${project.deadline.toDateString()}. Please ensure all tasks and submissions are completed.`;

    // Notify the creator (faculty / business)
    if (project.createdBy?.email) {
      await sendEmail(
        project.createdBy.email,
        "Project Deadline Approaching",
        message
      );
    }

    // Notify accepted students
    for (const applicant of project.applicants) {
      if (applicant.status === "accepted" && applicant.student?.email) {
        await sendEmail(
          applicant.student.email,
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
    dueDate: { $lte: twoDaysAhead, $gte: today },
  })
    .populate("assignedTo")
    .populate({
      path: "project",
      populate: { path: "createdBy", select: "name email" },
    });

  for (const task of tasks) {
    const taskMessage = `🕓 Reminder: The task "${task.title}" under project "${
      task.project.title
    }" is due on ${task.dueDate.toDateString()}. Please complete it on time.`;

    // Notify assigned student
    if (task.assignedTo?.email) {
      await sendEmail(
        task.assignedTo.email,
        "Task Deadline Approaching",
        taskMessage
      );
    }

    // Notify the faculty / business who created the project
    if (task.project?.createdBy?.email) {
      await sendEmail(
        task.project.createdBy.email,
        "Task Deadline Reminder (Student Task)",
        taskMessage
      );
    }
  }

  console.log("✅ Daily deadline check completed.");
});
