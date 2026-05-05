const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Basic rule-based evaluation ───────────────────────────────────────────────
const evaluateBasic = ({ question, answer, expectedKeywords = [] }) => {
  const text = answer.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Length score (0–3)
  let lengthScore = 0;
  if (wordCount >= 100) lengthScore = 3;
  else if (wordCount >= 50) lengthScore = 2;
  else if (wordCount >= 20) lengthScore = 1;

  // Keyword match score (0–5)
  const matchedKeywords = expectedKeywords.filter((kw) =>
    text.includes(kw.toLowerCase())
  );
  const keywordScore = expectedKeywords.length > 0
    ? Math.round((matchedKeywords.length / expectedKeywords.length) * 5)
    : 2; // neutral if no keywords defined

  // Structure score (0–2): checks for STAR-like structure signals
  const structureSignals = ["because", "therefore", "result", "solution", "approach", "implemented", "achieved", "learned"];
  const structureHits = structureSignals.filter((s) => text.includes(s)).length;
  const structureScore = structureHits >= 3 ? 2 : structureHits >= 1 ? 1 : 0;

  const total = Math.min(10, lengthScore + keywordScore + structureScore);

  const feedback = buildBasicFeedback({ wordCount, matchedKeywords, expectedKeywords, total });

  return {
    score: total,
    feedback,
    matchedKeywords,
    evaluationMethod: "basic",
  };
};

const buildBasicFeedback = ({ wordCount, matchedKeywords, expectedKeywords, total }) => {
  const tips = [];
  if (wordCount < 20) tips.push("Your answer is very short. Elaborate with examples and context.");
  else if (wordCount < 50) tips.push("Try to expand your answer with more detail and examples.");
  if (expectedKeywords.length > 0 && matchedKeywords.length < expectedKeywords.length / 2) {
    tips.push(`Consider covering key concepts: ${expectedKeywords.slice(0, 3).join(", ")}.`);
  }
  if (total >= 8) tips.push("Excellent answer! Well-structured and comprehensive.");
  else if (total >= 6) tips.push("Good answer. Adding specific examples would strengthen it.");
  else if (total >= 4) tips.push("Decent attempt. Focus on depth and relevant keywords.");
  else tips.push("Try to provide a more detailed and structured response.");
  return tips.join(" ");
};

// ── AI-based evaluation via Gemini ────────────────────────────────────────────
const evaluateWithAI = async ({ question, answer, skill = "", difficulty = "medium" }) => {
  if (!answer || answer.trim().length < 10) {
    return { score: 0, feedback: "No meaningful answer provided.", evaluationMethod: "ai" };
  }

  const prompt = `You are a senior technical interviewer evaluating a candidate's answer.

Question: ${question}
Skill Area: ${skill || "General"}
Difficulty: ${difficulty}
Candidate's Answer: ${answer}

Evaluate the answer on these criteria:
1. Technical accuracy and depth (0-4 points)
2. Clarity and structure (0-3 points)  
3. Use of examples or practical knowledge (0-3 points)

Return ONLY valid JSON, no markdown:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI evaluation response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(10, Math.max(0, Number(parsed.score) || 0)),
      feedback: parsed.feedback || "",
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      evaluationMethod: "ai",
    };
  } catch (err) {
    console.error("Gemini evaluation error:", err.message);
    // Fallback to basic
    return { ...evaluateBasic({ question, answer }), evaluationMethod: "basic" };
  }
};

// ── Adaptive difficulty logic ─────────────────────────────────────────────────
const getNextDifficulty = (currentDifficulty, score) => {
  const order = ["easy", "medium", "hard"];
  const idx = order.indexOf(currentDifficulty);
  const safeIdx = idx === -1 ? 1 : idx;
  if (score >= 7) return order[Math.min(safeIdx + 1, 2)];
  if (score < 5)  return order[Math.max(safeIdx - 1, 0)];
  return currentDifficulty;
};

// ── Final report generation ───────────────────────────────────────────────────
const generateReport = async (interview) => {
  const answers = interview.answers || [];
  if (answers.length === 0) {
    return { overallScore: 0, skillBreakdown: {}, strengths: [], weaknesses: [], suggestions: [] };
  }

  const totalScore = answers.reduce((s, a) => s + (a.score || 0), 0);
  const overallScore = Math.round((totalScore / (answers.length * 10)) * 100);

  // Skill breakdown
  const skillMap = {};
  answers.forEach((a) => {
    const skill = a.skill || "General";
    if (!skillMap[skill]) skillMap[skill] = { total: 0, count: 0 };
    skillMap[skill].total += a.score || 0;
    skillMap[skill].count += 1;
  });
  const skillBreakdown = {};
  Object.entries(skillMap).forEach(([skill, data]) => {
    skillBreakdown[skill] = Math.round((data.total / (data.count * 10)) * 100);
  });

  // Strengths and weaknesses
  const sorted = Object.entries(skillBreakdown).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.filter(([, v]) => v >= 70).map(([k]) => k);
  const weaknesses = sorted.filter(([, v]) => v < 50).map(([k]) => k);

  // AI-generated suggestions
  let suggestions = [];
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Based on this interview performance, provide 3 specific improvement suggestions.
Role: ${interview.role}
Skills: ${interview.skills.join(", ")}
Overall Score: ${overallScore}%
Weak areas: ${weaknesses.join(", ") || "None identified"}
Strong areas: ${strengths.join(", ") || "None identified"}

Return ONLY a JSON array of 3 strings:
["suggestion1", "suggestion2", "suggestion3"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) suggestions = JSON.parse(jsonMatch[0]).slice(0, 3);
  } catch {
    suggestions = [
      "Practice explaining technical concepts with concrete examples.",
      "Work on structuring answers using the STAR method.",
      "Review fundamentals in your weaker skill areas.",
    ];
  }

  return { overallScore, skillBreakdown, strengths, weaknesses, suggestions };
};

module.exports = { evaluateBasic, evaluateWithAI, getNextDifficulty, generateReport };
