import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "draft", "closed"],
      default: "draft",
    },
    requirements: { type: String, required: true },
    skills: {
      type: [String],
      default: [],
    },
    max_students: {
      type: Number,
      required: true,
      default: 1,
    },
    deadline: { type: Date },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
