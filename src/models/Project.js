import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    skillsRequired: [String],
    budget: { type: Number, default: 0 },
    deadline: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Faculty or Business
      required: true,
    },
    applicants: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["applied", "accepted", "rejected"],
          default: "applied",
        },
      },
    ],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed"],
      default: "open",
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
