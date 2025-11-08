import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Project from "../models/Project.js";
import Application from "../models/Application.js";
import ProjectMember from "../models/ProjectMember.js";

dotenv.config();

// Sample data arrays
const facultyNames = [
  "Dr. Sarah Johnson",
  "Prof. Michael Chen",
  "Dr. Emily Rodriguez",
  "Prof. David Kim",
  "Dr. Lisa Anderson",
  "Prof. James Wilson",
  "Dr. Maria Garcia",
  "Prof. Robert Taylor",
];

const studentNames = [
  "Alex Thompson",
  "Jordan Martinez",
  "Sam Williams",
  "Taylor Brown",
  "Casey Davis",
  "Morgan Lee",
  "Riley White",
  "Quinn Harris",
  "Blake Miller",
  "Cameron Moore",
  "Dakota Jackson",
  "Sage Lewis",
  "River Clark",
  "Phoenix Walker",
  "Skylar Hall",
];

const projectTitles = [
  "AI-Powered Learning Management System",
  "Blockchain-Based Voting System",
  "IoT Smart Home Automation",
  "Machine Learning for Medical Diagnosis",
  "Mobile App for Mental Health Tracking",
  "E-Commerce Platform with Recommendation Engine",
  "Real-Time Collaboration Tool",
  "Cybersecurity Threat Detection System",
  "Data Analytics Dashboard for Business Intelligence",
  "Augmented Reality Educational Platform",
  "Cloud-Based File Storage System",
  "Social Media Sentiment Analysis Tool",
  "Automated Code Review System",
  "Virtual Reality Training Simulator",
  "Predictive Maintenance System for Manufacturing",
];

const projectDescriptions = [
  "Develop an intelligent learning management system that personalizes content delivery based on student performance and learning patterns.",
  "Create a secure, transparent voting system using blockchain technology to ensure election integrity.",
  "Build a comprehensive IoT solution for home automation with voice control and mobile app integration.",
  "Design a machine learning model to assist doctors in early disease detection using medical imaging.",
  "Create a mobile application that helps users track their mental health and provides resources for support.",
  "Develop an e-commerce platform with an AI-powered recommendation system to enhance user experience.",
  "Build a real-time collaboration tool for teams to work together on documents, code, and projects.",
  "Implement a system that detects and prevents cybersecurity threats using machine learning algorithms.",
  "Create an interactive dashboard that visualizes business data and provides actionable insights.",
  "Develop an AR platform that enhances learning experiences through immersive educational content.",
  "Design a secure, scalable cloud storage system with advanced file management features.",
  "Build a tool that analyzes social media posts to gauge public sentiment on various topics.",
  "Create an automated system that reviews code for bugs, security issues, and best practices.",
  "Develop a VR simulator for training purposes in various industries like healthcare and aviation.",
  "Build a predictive system that forecasts equipment failures to optimize maintenance schedules.",
];

const skills = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "MongoDB",
  "Machine Learning",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "Mobile Development",
  "UI/UX Design",
  "Blockchain",
  "IoT",
  "DevOps",
  "Full Stack Development",
  "AI/ML",
  "Database Design",
  "API Development",
  "Web Development",
  "Software Engineering",
];

const coverLetters = [
  "I am very interested in this project and believe my skills align well with the requirements.",
  "This project excites me, and I would love to contribute my expertise to make it successful.",
  "I have been looking for an opportunity like this and would be thrilled to be part of the team.",
  "My background in this field makes me a strong candidate for this project.",
  "I am passionate about this domain and eager to apply my knowledge to this project.",
  "This project aligns perfectly with my career goals and interests.",
  "I would bring fresh perspectives and dedication to this project.",
  "I am excited about the opportunity to work on this innovative project.",
];

// Helper function to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random elements from array
const randomElements = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get random date in the future
const randomFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow) + 30);
  return date;
};

// Helper function to generate email from name
const generateEmail = (name) => {
  const normalized = name.toLowerCase().replace(/\s+/g, ".");
  return `${normalized}@university.edu`;
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - skip if authentication fails)
    console.log("Clearing existing data...");
    try {
      await ProjectMember.deleteMany({});
      await Application.deleteMany({});
      await Project.deleteMany({});
      await Profile.deleteMany({});
      await User.deleteMany({});
      console.log("✅ Existing data cleared");
    } catch (error) {
      console.log("⚠️  Could not clear existing data (continuing anyway):", error.message);
    }

    // Create Faculty Users and Profiles
    console.log("Creating faculty users...");
    const facultyUsers = [];
    const facultyProfiles = [];

    for (const name of facultyNames) {
      const email = generateEmail(name);
      
      // Check if user already exists, if not create
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          password: "password123", // Default password for seeded users
          role: "faculty",
        });
      }
      facultyUsers.push(user);

      // Check if profile already exists, if not create
      let profile = await Profile.findOne({ user_id: user._id });
      if (!profile) {
        profile = await Profile.create({
          user_id: user._id,
          full_name: name,
          email,
          bio: `Experienced ${randomElement(["researcher", "educator", "practitioner"])} with expertise in ${randomElements(skills, 3).join(", ")}.`,
          skills: randomElements(skills, Math.floor(Math.random() * 5) + 2),
        });
      }
      facultyProfiles.push(profile);
    }

    console.log(`Created ${facultyUsers.length} faculty users`);

    // Create Student Users and Profiles
    console.log("Creating student users...");
    const studentUsers = [];
    const studentProfiles = [];

    for (const name of studentNames) {
      const email = generateEmail(name);
      
      // Check if user already exists, if not create
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          password: "password123", // Default password for seeded users
          role: "student",
        });
      }
      studentUsers.push(user);

      // Check if profile already exists, if not create
      let profile = await Profile.findOne({ user_id: user._id });
      if (!profile) {
        profile = await Profile.create({
          user_id: user._id,
          full_name: name,
          email,
          bio: `Motivated student with interests in ${randomElements(skills, 2).join(" and ")}.`,
          skills: randomElements(skills, Math.floor(Math.random() * 4) + 1),
        });
      }
      studentProfiles.push(profile);
    }

    console.log(`Created ${studentUsers.length} student users`);

    // Create Projects
    console.log("Creating projects...");
    const projects = [];

    for (let i = 0; i < projectTitles.length; i++) {
      const faculty = randomElement(facultyUsers);
      const status = randomElement(["active", "active", "active", "draft", "closed"]); // More active projects
      
      // Check if project already exists, if not create
      let project = await Project.findOne({ title: projectTitles[i] });
      if (!project) {
        project = await Project.create({
          title: projectTitles[i],
          description: projectDescriptions[i],
          faculty_id: faculty._id,
          status,
          requirements: `Looking for students with experience in ${randomElements(skills, 3).join(", ")}. Strong problem-solving skills and ability to work in a team are essential.`,
          skills: randomElements(skills, Math.floor(Math.random() * 4) + 2),
          max_students: Math.floor(Math.random() * 3) + 1, // 1-3 students
          deadline: status === "active" ? randomFutureDate(90) : null,
        });
      }
      projects.push(project);
    }

    console.log(`Created ${projects.length} projects`);

    // Create Applications (students applying to projects)
    console.log("Creating applications...");
    const activeProjects = projects.filter((p) => p.status === "active");
    let applicationCount = 0;

    for (const student of studentUsers) {
      // Each student applies to 1-3 random active projects
      const projectsToApply = randomElements(activeProjects, Math.floor(Math.random() * 3) + 1);

      for (const project of projectsToApply) {
        try {
          const application = await Application.create({
            project_id: project._id,
            student_id: student._id,
            status: randomElement(["pending", "pending", "pending", "accepted", "rejected"]), // Mostly pending
            cover_letter: randomElement(coverLetters),
            resume_url: `https://example.com/resumes/${student._id}.pdf`,
          });
          applicationCount++;
        } catch (error) {
          // Skip if duplicate application (shouldn't happen with this logic, but just in case)
          if (error.code !== 11000) {
            throw error;
          }
        }
      }
    }

    console.log(`Created ${applicationCount} applications`);

    // Create Project Members (accepted students)
    console.log("Creating project members...");
    let memberCount = 0;

    // Get accepted applications
    const acceptedApplications = await Application.find({ status: "accepted" });

    for (const application of acceptedApplications) {
      try {
        // Check if project still has capacity
        const project = await Project.findById(application.project_id);
        const currentMembers = await ProjectMember.countDocuments({
          project_id: application.project_id,
        });

        if (currentMembers < project.max_students) {
          await ProjectMember.create({
            project_id: application.project_id,
            student_id: application.student_id,
          });
          memberCount++;
        }
      } catch (error) {
        // Skip if duplicate membership
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    console.log(`Created ${memberCount} project members`);

    console.log("\n✅ Seeding completed successfully!");
    console.log("\nSummary:");
    console.log(`- Faculty: ${facultyUsers.length}`);
    console.log(`- Students: ${studentUsers.length}`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Applications: ${applicationCount}`);
    console.log(`- Project Members: ${memberCount}`);
    console.log("\nDefault password for all seeded users: password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedData();

