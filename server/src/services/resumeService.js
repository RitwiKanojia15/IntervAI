const path = require("path");
const mammoth = require("mammoth");
const pdfParseLib = require("pdf-parse");
const pdfParse = typeof pdfParseLib === "function" ? pdfParseLib : pdfParseLib.default;
const AppError = require("../utils/appError");

const LANGUAGE_KEYWORDS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "php",
  "ruby",
  "sql",
];

const SKILL_KEYWORDS = [
  "react",
  "node.js",
  "node",
  "express",
  "mongodb",
  "mysql",
  "postgresql",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "redis",
  "git",
  "tailwind",
  "next.js",
  "machine learning",
  "deep learning",
  "data structures",
  "algorithms",
];

const uniqueNormalized = (values = []) => Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));

const extractProjectTitles = (rawText = "") => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const projectTitles = [];

  lines.forEach((line) => {
    const projectMatch = line.match(/^(project|projects)\s*:\s*(.+)$/i);
    if (projectMatch?.[2]) {
      projectTitles.push(projectMatch[2]);
      return;
    }

    const titledEntryMatch = line.match(/^([A-Za-z0-9][A-Za-z0-9\s\-&+#/.]{2,80})\s*[|:-]\s*(react|node|python|java|mongodb|sql|aws|docker|api)/i);
    if (titledEntryMatch?.[1]) {
      projectTitles.push(titledEntryMatch[1]);
    }
  });

  return uniqueNormalized(projectTitles).slice(0, 8);
};

const computeTechnicalStrengths = ({ languages, skills, projectTitles }) => {
  const strengths = [];
  const normalizedSkills = skills.map((skill) => skill.toLowerCase());

  if (normalizedSkills.includes("react") && (normalizedSkills.includes("node") || normalizedSkills.includes("node.js"))) {
    strengths.push("Shows full-stack development capability with React and Node.js.");
  }

  if (normalizedSkills.includes("mongodb") || normalizedSkills.includes("mysql") || normalizedSkills.includes("postgresql")) {
    strengths.push("Has practical database knowledge for building data-driven applications.");
  }

  if (normalizedSkills.includes("machine learning") || normalizedSkills.includes("deep learning")) {
    strengths.push("Demonstrates exposure to AI/ML problem-solving.");
  }

  if (projectTitles.length >= 2) {
    strengths.push("Project portfolio suggests hands-on implementation ability.");
  }

  if (languages.length >= 3) {
    strengths.push("Uses multiple programming languages, indicating adaptability.");
  }

  if (strengths.length === 0) {
    strengths.push("Resume indicates foundational technical potential; add clearer project/skill details for deeper insights.");
  }

  return strengths;
};

const extractTextFromResume = async (file) => {
  const mimeType = file.mimetype || "";
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || "";
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value || "";
  }

  if (mimeType === "application/msword" || extension === ".doc") {
    return file.buffer.toString("utf8");
  }

  throw new AppError("Unsupported file type. Please upload PDF or DOCX.", 400);
};

const analyzeResumeText = (rawText = "") => {
  const normalized = rawText.toLowerCase();
  const languages = uniqueNormalized(
    LANGUAGE_KEYWORDS.filter((keyword) => normalized.includes(keyword)).map((entry) => entry.toUpperCase())
  );
  const skills = uniqueNormalized(
    SKILL_KEYWORDS.filter((keyword) => normalized.includes(keyword)).map((entry) => entry)
  );
  const projectTitles = extractProjectTitles(rawText);
  const technicalStrengths = computeTechnicalStrengths({
    languages,
    skills,
    projectTitles,
  });

  return {
    languages,
    skills,
    projectTitles,
    technicalStrengths,
    summary:
      technicalStrengths[0] ||
      "Resume parsed successfully. Add more explicit technical keywords to improve analysis quality.",
  };
};

const processResumeUpload = async (file) => {
  if (!file) {
    throw new AppError("Resume file is required.", 400);
  }

  const extractedText = await extractTextFromResume(file);
  if (!extractedText || extractedText.trim().length < 20) {
    throw new AppError("Could not extract enough content from the resume.", 422);
  }

  const analysis = analyzeResumeText(extractedText);
  return {
    filename: file.originalname,
    analysis,
  };
};

module.exports = {
  processResumeUpload,
};
