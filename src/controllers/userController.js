import User from "../models/User.js";
import Profile from "../models/Profile.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { full_name, email, avatar_url, bio, skills, resume_url } = req.body;

    let profile = await Profile.findOne({ user_id: req.user._id });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await Profile.create({
        user_id: req.user._id,
        full_name: full_name || "",
        email: req.user.email,
        skills: skills || [],
      });
    } else {
      // Update existing profile
      if (full_name) profile.full_name = full_name;
      if (email) profile.email = email;
      if (avatar_url !== undefined) profile.avatar_url = avatar_url;
      if (bio !== undefined) profile.bio = bio;
      if (skills) profile.skills = skills;
      if (resume_url !== undefined) profile.resume_url = resume_url;

      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
