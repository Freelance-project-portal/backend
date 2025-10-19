export const matchProjectsToStudent = (projects, student) => {
  const studentSkills = student.skills || [];
  const studentInterests = student.interests || [];

  const recommendations = projects.map((project) => {
    let matchScore = 0;

    // ✅ 1. Skill Matching
    const matchedSkills = project.skillsRequired.filter((skill) =>
      studentSkills.includes(skill)
    );
    matchScore += matchedSkills.length * 10; // +10 per matching skill

    // ✅ 2. Interest Matching
    const matchedInterests = project.skillsRequired.filter((skill) =>
      studentInterests.includes(skill)
    );
    matchScore += matchedInterests.length * 5; // +5 per matching interest

    // ✅ 3. Bonus for "open" status projects
    if (project.status === "open") {
      matchScore += 15; // small bias towards open projects
    } else if (project.status === "in-progress") {
      matchScore += 5; // still allow them but less priority
    }

    return { project, matchScore };
  });

  // ✅ Sort projects by score (descending)
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
};