export const matchProjectsToStudent = (projects, studentProfile) => {
  const studentSkills = studentProfile?.skills || [];

  const recommendations = projects.map((project) => {
    let matchScore = 0;

    // ✅ 1. Skill Matching
    const matchedSkills = project.skills.filter((skill) =>
      studentSkills.includes(skill)
    );
    matchScore += matchedSkills.length * 10; // +10 per matching skill

    // ✅ 2. Bonus for "active" status projects
    if (project.status === "active") {
      matchScore += 15; // small bias towards active projects
    } else if (project.status === "draft") {
      matchScore += 5; // still allow them but less priority
    }

    return { project, matchScore };
  });

  // ✅ Sort projects by score (descending)
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
};