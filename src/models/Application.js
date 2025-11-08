import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    cover_letter: {
      type: String,
      required: true,
    },
    resume_url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Index to prevent duplicate applications
applicationSchema.index({ project_id: 1, student_id: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;

