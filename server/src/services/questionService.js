const { GoogleGenerativeAI } = require("@google/generative-ai");
const Question = require("../models/Question");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "actually", "sort of", "kind of", "right"];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ── Fetch one open-ended question from DB ─────────────────────────────────────
const fetchOneFromDB = async ({ skills = [], difficulty = "medium", excludeTexts = [] }) => {
  const match = { category: "technical", difficulty };
  if (skills.length > 0) {
    match.topic = { $in: skills.map((s) => new RegExp(s, "i")) };
  }

  let docs = await Question.aggregate([{ $match: match }, { $sample: { size: 10 } }]);

  if (docs.length === 0) {
    docs = await Question.aggregate([{ $match: { category: "technical", difficulty } }, { $sample: { size: 10 } }]);
  }

  const seen = new Set(excludeTexts.map((t) => t.toLowerCase()));
  for (const d of docs) {
    if (!seen.has(d.question.toLowerCase())) {
      return {
        question: d.question,
        skill: d.topic || "",
        difficulty: d.difficulty,
        source: "db",
        expectedKeywords: d.explanation ? d.explanation.split(" ").slice(0, 8) : [],
      };
    }
  }
  return null;
};

// ── Generate the NEXT contextual question via Gemini ─────────────────────────
// This is the core of the adaptive interview — each question is informed by:
// 1. The role and skills
// 2. Resume data (projects, languages)
// 3. All previous Q&A pairs
// 4. The score on the last answer (adaptive difficulty)
const generateNextQuestion = async ({
  role,
  skills = [],
  difficulty = "medium",
  resumeData = null,
  conversationHistory = [], // [{ question, answer, score, skill }]
  excludeTexts = [],
  questionNumber = 1,
  totalQuestions = 10,
}) => {
  const skillStr = skills.length > 0 ? skills.join(", ") : role;

  // Build resume context
  let resumeContext = "";
  if (resumeData) {
    const parts = [];
    if (resumeData.skills?.length)        parts.push(`Skills: ${resumeData.skills.slice(0, 6).join(", ")}`);
    if (resumeData.languages?.length)     parts.push(`Languages: ${resumeData.languages.slice(0, 4).join(", ")}`);
    if (resumeData.projectTitles?.length) parts.push(`Projects: ${resumeData.projectTitles.slice(0, 3).join(", ")}`);
    if (resumeData.summary)               parts.push(`Summary: ${resumeData.summary}`);
    if (parts.length) resumeContext = `\nCandidate Resume:\n${parts.join("\n")}`;
  }

  // Build conversation context (last 3 Q&A pairs to keep prompt short)
  let convContext = "";
  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-3);
    convContext = "\nPrevious conversation:\n" + recent.map((h, i) =>
      `Q${i + 1} [${h.skill || "General"}, score ${h.score}/10]: ${h.question}\nAnswer: ${h.answer.slice(0, 200)}${h.answer.length > 200 ? "..." : ""}`
    ).join("\n\n");
  }

  // Determine question type based on position in interview
  let questionFocus = "";
  if (questionNumber === 1) {
    questionFocus = "Start with an introductory question about their background and experience.";
  } else if (questionNumber <= 3) {
    questionFocus = "Ask about their technical experience with the specified skills.";
  } else if (questionNumber <= 6) {
    questionFocus = "Ask a deeper technical or problem-solving question based on their previous answers.";
  } else if (questionNumber <= 8) {
    questionFocus = "Ask a scenario-based or system design question relevant to their role.";
  } else {
    questionFocus = "Ask a behavioural or situational question to assess soft skills.";
  }

  // If last answer was weak, probe the same topic; if strong, advance
  let adaptiveInstruction = "";
  if (conversationHistory.length > 0) {
    const last = conversationHistory[conversationHistory.length - 1];
    if (last.score <= 4) {
      adaptiveInstruction = `The candidate struggled with the last question (score ${last.score}/10). Ask a simpler follow-up or probe the same topic differently.`;
    } else if (last.score >= 8) {
      adaptiveInstruction = `The candidate answered well (score ${last.score}/10). Ask a more challenging follow-up or advance to a harder concept.`;
    } else {
      adaptiveInstruction = `The candidate gave a decent answer (score ${last.score}/10). Continue with a related but different topic.`;
    }
  }

  const excludeStr = excludeTexts.length > 0
    ? `\nDo NOT ask any of these questions:\n${excludeTexts.slice(-8).map((t, i) => `${i + 1}. ${t}`).join("\n")}`
    : "";

  const prompt = `You are a senior technical interviewer conducting question ${questionNumber} of ${totalQuestions} for a ${role} role.
Skills focus: ${skillStr}
Current difficulty: ${difficulty}
${resumeContext}
${convContext}

Instructions:
- ${questionFocus}
- ${adaptiveInstruction || "Ask a relevant technical question."}
- Make the question specific and contextual — reference their resume or previous answers if relevant.
- Do NOT ask generic questions like "Tell me about yourself" after Q1.
${excludeStr}

Return ONLY valid JSON (no markdown):
{
  "question": "<the interview question>",
  "skill": "<primary skill being tested>",
  "difficulty": "${difficulty}",
  "expectedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      question: parsed.question || "",
      skill: parsed.skill || skillStr,
      difficulty: parsed.difficulty || difficulty,
      source: "ai",
      expectedKeywords: Array.isArray(parsed.expectedKeywords) ? parsed.expectedKeywords : [],
    };
  } catch (err) {
    console.error("Gemini next-question error:", err.message);
    return generateFallbackQuestion({ role, skills, difficulty, questionNumber, conversationHistory });
  }
};

// ── Fallback when AI is unavailable ──────────────────────────────────────────
const generateFallbackQuestion = ({ role, skills, difficulty, questionNumber, conversationHistory = [] }) => {
  const skill = skills[questionNumber % skills.length] || role;
  const pool = [
    { question: `Walk me through how you would design a scalable ${skill} system.`, skill, difficulty, source: "ai", expectedKeywords: ["scalability", "design", "architecture", "trade-offs"] },
    { question: `What's the most complex ${skill} problem you've solved? How did you approach it?`, skill, difficulty, source: "ai", expectedKeywords: ["problem", "approach", "solution", "result"] },
    { question: `How do you ensure code quality and maintainability in ${skill} projects?`, skill, difficulty, source: "ai", expectedKeywords: ["testing", "review", "standards", "documentation"] },
    { question: `Describe a time you had to optimise performance in a ${skill} application.`, skill, difficulty, source: "ai", expectedKeywords: ["profiling", "bottleneck", "optimisation", "metrics"] },
    { question: `How do you handle errors and edge cases in ${skill}?`, skill, difficulty, source: "ai", expectedKeywords: ["error handling", "edge cases", "validation", "logging"] },
    { question: `What are the key differences between ${skill} and alternative approaches?`, skill, difficulty, source: "ai", expectedKeywords: ["comparison", "trade-offs", "use cases", "advantages"] },
    { question: `Describe your experience working in a team on a ${skill} project.`, skill, difficulty, source: "ai", expectedKeywords: ["collaboration", "communication", "git", "review"] },
    { question: `How do you stay up to date with changes in ${skill}?`, skill, difficulty, source: "ai", expectedKeywords: ["learning", "community", "documentation", "practice"] },
    { question: `What would you do differently if you could redo your most recent ${skill} project?`, skill, difficulty, source: "ai", expectedKeywords: ["reflection", "improvement", "lessons", "architecture"] },
    { question: `How do you approach debugging a difficult issue in ${skill}?`, skill, difficulty, source: "ai", expectedKeywords: ["debugging", "logs", "reproduce", "isolate"] },
  ];

  // Avoid repeating questions already asked
  const usedQuestions = new Set(conversationHistory.map((h) => h.question));
  const available = pool.filter((q) => !usedQuestions.has(q.question));
  return available[questionNumber % available.length] || pool[0];
};

// ── Initial question set (first question only, rest generated dynamically) ────
const getFirstQuestion = async ({ role, skills = [], difficulty = "medium", resumeData = null }) => {
  // Always start with a personalised intro question
  const skillStr = skills.length > 0 ? skills.join(", ") : role;
  const resumeHint = resumeData?.projectTitles?.length
    ? ` I can see you've worked on projects like ${resumeData.projectTitles[0]}.`
    : "";

  const introQuestion = {
    question: `Tell me about yourself and your experience as a ${role}.${resumeHint} What are the key skills and projects you're most proud of?`,
    skill: "Introduction",
    difficulty: "easy",
    source: "ai",
    expectedKeywords: ["experience", "skills", "projects", "role", "background"],
  };

  return introQuestion;
};

// ── Legacy batch fetcher (kept for compatibility) ─────────────────────────────
const getInterviewQuestions = async ({ role, skills = [], difficulty = "medium", count = 7, excludeTexts = [], resumeData = null }) => {
  // Generate first question immediately, rest will be generated dynamically
  const first = await getFirstQuestion({ role, skills, difficulty, resumeData });
  return [first];
};

// ── Communication analysis ────────────────────────────────────────────────────
const analyzeCommunication = (transcripts = []) => {
  if (!transcripts || transcripts.length === 0) {
    return { fluency: 0, confidence: 0, clarity: 0, fillerCount: 0 };
  }

  const allText = transcripts.join(" ").toLowerCase();
  const words = allText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 5) {
    return { fluency: 10, confidence: 10, clarity: 10, fillerCount: 0 };
  }

  const fillerCount = FILLER_WORDS.reduce((acc, fw) => {
    const regex = new RegExp(`\\b${fw}\\b`, "gi");
    return acc + (allText.match(regex) || []).length;
  }, 0);

  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const avgWordsPerAnswer = wordCount / transcripts.length;

  const fluencyLength   = avgWordsPerAnswer >= 60 ? 45 : avgWordsPerAnswer >= 30 ? 35 : avgWordsPerAnswer >= 15 ? 25 : 15;
  const fluencySentence = avgWordsPerSentence >= 6 && avgWordsPerSentence <= 30 ? 30 : 15;
  const fluencyFiller   = Math.max(0, 25 - fillerCount * 3);
  const fluency         = Math.min(100, Math.round(fluencyLength + fluencySentence + fluencyFiller));

  const confidenceBase   = avgWordsPerAnswer >= 40 ? 70 : avgWordsPerAnswer >= 20 ? 55 : 40;
  const confidenceFiller = Math.max(0, 30 - fillerCount * 4);
  const confidence       = Math.min(100, Math.round(confidenceBase + confidenceFiller));

  const clarityLength   = avgWordsPerAnswer >= 20 ? 40 : avgWordsPerAnswer >= 10 ? 28 : 15;
  const claritySentence = avgWordsPerSentence >= 5 && avgWordsPerSentence <= 25 ? 35 : 20;
  const clarityFiller   = Math.max(0, 25 - fillerCount * 3);
  const clarity         = Math.min(100, Math.round(clarityLength + claritySentence + clarityFiller));

  return { fluency, confidence, clarity, fillerCount };
};


module.exports = { getInterviewQuestions, getFirstQuestion, generateNextQuestion, analyzeCommunication, generateWithAI: generateNextQuestion };
