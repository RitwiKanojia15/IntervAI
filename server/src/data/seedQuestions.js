require("dotenv").config();

const connectDatabase = require("../config/db");
const Question = require("../models/Question");
const questions = require("./questionSeed");

const seedQuestions = async () => {
  try {
    await connectDatabase();
    await Question.deleteMany({});
    await Question.insertMany(questions);
    // eslint-disable-next-line no-console
    console.log(`Seeded ${questions.length} questions successfully.`);
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to seed questions:", error);
    process.exit(1);
  }
};

seedQuestions();
