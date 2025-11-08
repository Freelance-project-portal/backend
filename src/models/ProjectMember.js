import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index to prevent duplicate memberships
projectMemberSchema.index({ project_id: 1, student_id: 1 }, { unique: true });

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);
export default ProjectMember;

