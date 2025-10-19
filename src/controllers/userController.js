import User from "../models/User.js";

export const updateUserProfile = async (req, res) => {
  try {
    const { skills, interests, academicScore } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (skills) user.skills = skills;
    if (interests) user.interests = interests;
    if (academicScore !== undefined) user.academicScore = academicScore;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
