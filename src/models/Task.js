import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "done"],
      default: "pending",
    },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
