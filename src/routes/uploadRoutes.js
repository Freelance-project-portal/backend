import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { protect, requireRole } from "../middlewares/authMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or Word documents are allowed"));
    }
  },
});

const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "student-resumes",
      resource_type: "raw",
      public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

router.post(
  "/resume",
  protect,
  requireRole("student"),
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

      return res.status(201).json({
        url: result.secure_url,
        public_id: result.public_id,
        bytes: result.bytes,
        format: result.format,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Failed to upload resume",
      });
    }
  }
);

export default router;

