const questions = [
  {
    category: "quantitative",
    topic: "percentages",
    difficulty: "easy",
    type: "mcq",
    question: "A laptop marked at Rs. 50,000 is sold after a 10% discount. What is the selling price?",
    options: [
      { optionId: "A", text: "Rs. 40,000" },
      { optionId: "B", text: "Rs. 45,000" },
      { optionId: "C", text: "Rs. 47,500" },
      { optionId: "D", text: "Rs. 48,000" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "10% of 50,000 is 5,000, so the selling price is Rs. 45,000.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "quantitative",
    topic: "averages",
    difficulty: "easy",
    type: "mcq",
    question: "The average of 14, 18, 22, and 26 is:",
    options: [
      { optionId: "A", text: "18" },
      { optionId: "B", text: "19" },
      { optionId: "C", text: "20" },
      { optionId: "D", text: "21" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "The sum is 80 and 80 / 4 = 20.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "quantitative",
    topic: "ratios",
    difficulty: "medium",
    type: "mcq",
    question: "The ratio of boys to girls in a class is 7:5. If there are 24 more boys than girls, how many students are there in total?",
    options: [
      { optionId: "A", text: "96" },
      { optionId: "B", text: "108" },
      { optionId: "C", text: "120" },
      { optionId: "D", text: "144" }
    ],
    answer: { correctOptionId: "D" },
    explanation: "The ratio difference is 2 parts, which equals 24. One part is 12, and 12 total parts make 144 students.",
    marks: 2,
    timeLimitSec: 75
  },
  {
    category: "quantitative",
    topic: "time-and-work",
    difficulty: "medium",
    type: "mcq",
    question: "A can finish a task in 12 days and B can finish it in 18 days. Working together, in how many days will they finish the task?",
    options: [
      { optionId: "A", text: "6.2 days" },
      { optionId: "B", text: "7.2 days" },
      { optionId: "C", text: "7.5 days" },
      { optionId: "D", text: "8 days" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "Combined work rate is 1/12 + 1/18 = 5/36, so time taken is 36/5 = 7.2 days.",
    marks: 2,
    timeLimitSec: 75
  },
  {
    category: "quantitative",
    topic: "probability",
    difficulty: "hard",
    type: "mcq",
    question: "Two fair dice are rolled together. What is the probability of getting a sum greater than 9?",
    options: [
      { optionId: "A", text: "1/6" },
      { optionId: "B", text: "5/18" },
      { optionId: "C", text: "1/4" },
      { optionId: "D", text: "7/18" }
    ],
    answer: { correctOptionId: "A" },
    explanation: "Sums greater than 9 are 10, 11, and 12. There are 6 favorable outcomes out of 36, so the probability is 1/6.",
    marks: 3,
    timeLimitSec: 90
  },
  {
    category: "logical-reasoning",
    topic: "series",
    difficulty: "easy",
    type: "mcq",
    question: "Find the next number in the series: 3, 6, 12, 24, ?",
    options: [
      { optionId: "A", text: "30" },
      { optionId: "B", text: "36" },
      { optionId: "C", text: "48" },
      { optionId: "D", text: "54" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "Each term is doubled, so the next number is 48.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "logical-reasoning",
    topic: "coding-decoding",
    difficulty: "easy",
    type: "mcq",
    question: "If CAT is coded as DBU, how is DOG coded using the same pattern?",
    options: [
      { optionId: "A", text: "EPH" },
      { optionId: "B", text: "EOH" },
      { optionId: "C", text: "FPH" },
      { optionId: "D", text: "EPG" }
    ],
    answer: { correctOptionId: "A" },
    explanation: "Each letter is shifted one step forward: D to E, O to P, and G to H.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "logical-reasoning",
    topic: "syllogism",
    difficulty: "medium",
    type: "mcq",
    question: "Statements: All roses are flowers. Some flowers fade quickly. Which conclusion follows?",
    options: [
      { optionId: "A", text: "All roses fade quickly." },
      { optionId: "B", text: "Some roses fade quickly." },
      { optionId: "C", text: "No rose fades quickly." },
      { optionId: "D", text: "No definite conclusion about roses fading can be made." }
    ],
    answer: { correctOptionId: "D" },
    explanation: "The statements do not say that the flowers fading quickly are roses, so no definite conclusion follows.",
    marks: 2,
    timeLimitSec: 60
  },
  {
    category: "logical-reasoning",
    topic: "blood-relations",
    difficulty: "medium",
    type: "mcq",
    question: "Ravi says, 'She is the daughter of my mother's only son.' How is the girl related to Ravi?",
    options: [
      { optionId: "A", text: "Sister" },
      { optionId: "B", text: "Daughter" },
      { optionId: "C", text: "Niece" },
      { optionId: "D", text: "Cousin" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "Ravi's mother's only son is Ravi himself, so the girl is Ravi's daughter.",
    marks: 2,
    timeLimitSec: 60
  },
  {
    category: "logical-reasoning",
    topic: "seating-arrangement",
    difficulty: "hard",
    type: "mcq",
    question: "Five friends P, Q, R, S, and T sit in a row. P is left of Q, S is right of T, and R is between Q and S. Who is in the middle?",
    options: [
      { optionId: "A", text: "Q" },
      { optionId: "B", text: "R" },
      { optionId: "C", text: "S" },
      { optionId: "D", text: "T" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "The valid order is P, Q, R, S, T, placing R in the middle.",
    marks: 3,
    timeLimitSec: 90
  },
  {
    category: "technical",
    topic: "javascript",
    difficulty: "easy",
    type: "mcq",
    question: "Which JavaScript keyword declares a block-scoped variable?",
    options: [
      { optionId: "A", text: "var" },
      { optionId: "B", text: "let" },
      { optionId: "C", text: "function" },
      { optionId: "D", text: "import" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "let creates a block-scoped variable, unlike var.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "technical",
    topic: "python",
    difficulty: "easy",
    type: "mcq",
    question: "Which keyword is used to define a function in Python?",
    options: [
      { optionId: "A", text: "func" },
      { optionId: "B", text: "define" },
      { optionId: "C", text: "def" },
      { optionId: "D", text: "lambda" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "Python uses the def keyword to declare functions.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "technical",
    topic: "c",
    difficulty: "medium",
    type: "mcq",
    question: "What is the correct way to declare a pointer to an integer in C?",
    options: [
      { optionId: "A", text: "int ptr;" },
      { optionId: "B", text: "int *ptr;" },
      { optionId: "C", text: "pointer int ptr;" },
      { optionId: "D", text: "ptr int*;" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "An integer pointer is declared as int *ptr;",
    marks: 2,
    timeLimitSec: 60
  },
  {
    category: "technical",
    topic: "c++",
    difficulty: "medium",
    type: "mcq",
    question: "Which C++ feature allows a derived class to provide its own implementation of a base class method?",
    options: [
      { optionId: "A", text: "Overloading" },
      { optionId: "B", text: "Encapsulation" },
      { optionId: "C", text: "Overriding" },
      { optionId: "D", text: "Template specialization" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "Method overriding lets a derived class replace a base class virtual method implementation.",
    marks: 2,
    timeLimitSec: 60
  },
  {
    category: "technical",
    topic: "javascript",
    difficulty: "hard",
    type: "mcq",
    question: "What does Promise.all return if one of the promises rejects?",
    options: [
      { optionId: "A", text: "It waits for all promises and returns partial results." },
      { optionId: "B", text: "It immediately rejects with that error." },
      { optionId: "C", text: "It resolves with undefined values." },
      { optionId: "D", text: "It retries the failed promise automatically." }
    ],
    answer: { correctOptionId: "B" },
    explanation: "Promise.all rejects as soon as any input promise rejects.",
    marks: 3,
    timeLimitSec: 75
  },
  {
    category: "spatial-reasoning",
    topic: "rotation",
    difficulty: "easy",
    type: "mcq",
    question: "If an arrow pointing north is rotated 90 degrees clockwise, which direction will it point?",
    options: [
      { optionId: "A", text: "West" },
      { optionId: "B", text: "East" },
      { optionId: "C", text: "South" },
      { optionId: "D", text: "North" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "A 90 degree clockwise rotation from north points east.",
    marks: 1,
    timeLimitSec: 30
  },
  {
    category: "spatial-reasoning",
    topic: "mirror-image",
    difficulty: "easy",
    type: "mcq",
    question: "If the word TOP is seen in a mirror, which letter will appear closest to the mirror line when the mirror is on the right side?",
    options: [
      { optionId: "A", text: "T" },
      { optionId: "B", text: "O" },
      { optionId: "C", text: "P" },
      { optionId: "D", text: "None of them" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "The rightmost letter is closest to a mirror placed on the right, so it is P.",
    marks: 1,
    timeLimitSec: 30
  },
  {
    category: "spatial-reasoning",
    topic: "paper-folding",
    difficulty: "medium",
    type: "mcq",
    question: "A square paper is folded once vertically and a hole is punched near the top edge. After unfolding, how many holes will be visible?",
    options: [
      { optionId: "A", text: "1" },
      { optionId: "B", text: "2" },
      { optionId: "C", text: "3" },
      { optionId: "D", text: "4" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "A single fold duplicates the punched hole across the fold line, so there will be two holes.",
    marks: 2,
    timeLimitSec: 45
  },
  {
    category: "spatial-reasoning",
    topic: "cube",
    difficulty: "medium",
    type: "mcq",
    question: "A cube has opposite faces painted red and blue, and the remaining four faces green. Which color is opposite a green face?",
    options: [
      { optionId: "A", text: "Red" },
      { optionId: "B", text: "Blue" },
      { optionId: "C", text: "Green" },
      { optionId: "D", text: "Cannot be determined" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "If four faces are green, they must form two opposite pairs, so a green face is opposite another green face.",
    marks: 2,
    timeLimitSec: 60
  },
  {
    category: "spatial-reasoning",
    topic: "figure-completion",
    difficulty: "hard",
    type: "mcq",
    question: "A shape gains one additional side at every step: triangle, square, pentagon. Which shape should come next?",
    options: [
      { optionId: "A", text: "Hexagon" },
      { optionId: "B", text: "Heptagon" },
      { optionId: "C", text: "Octagon" },
      { optionId: "D", text: "Nonagon" }
    ],
    answer: { correctOptionId: "A" },
    explanation: "The number of sides increases by one each time, so the next shape is a hexagon.",
    marks: 3,
    timeLimitSec: 60
  },
  {
    category: "logical-puzzles",
    topic: "truth-and-lie",
    difficulty: "easy",
    type: "mcq",
    question: "A says, 'B is lying.' B says, 'A is telling the truth.' Which statement is correct?",
    options: [
      { optionId: "A", text: "Both are telling the truth." },
      { optionId: "B", text: "Both are lying." },
      { optionId: "C", text: "A is lying and B is telling the truth." },
      { optionId: "D", text: "The statements cannot both be assigned consistent truth values." }
    ],
    answer: { correctOptionId: "D" },
    explanation: "If B says A is truthful, then A says B is lying, which makes B false. The pair is inconsistent.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "logical-puzzles",
    topic: "weighing",
    difficulty: "easy",
    type: "mcq",
    question: "You have 8 identical-looking balls and one is heavier. What is the minimum number of weighings needed to guarantee finding it with a balance scale?",
    options: [
      { optionId: "A", text: "1" },
      { optionId: "B", text: "2" },
      { optionId: "C", text: "3" },
      { optionId: "D", text: "4" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "Split the balls into 3-3-2 and use two weighings to isolate the heavier ball.",
    marks: 1,
    timeLimitSec: 45
  },
  {
    category: "logical-puzzles",
    topic: "arrangement",
    difficulty: "medium",
    type: "mcq",
    question: "Three boxes are labeled Apples, Oranges, and Mixed. Every label is wrong. If you pick one fruit from one box, from which box should you pick to identify all boxes?",
    options: [
      { optionId: "A", text: "Apples" },
      { optionId: "B", text: "Oranges" },
      { optionId: "C", text: "Mixed" },
      { optionId: "D", text: "Any box works equally well" }
    ],
    answer: { correctOptionId: "C" },
    explanation: "The box labeled Mixed cannot be mixed, so drawing from it reveals its true fruit type and unlocks the rest.",
    marks: 2,
    timeLimitSec: 60
  },
  {
    category: "logical-puzzles",
    topic: "bridge-crossing",
    difficulty: "medium",
    type: "mcq",
    question: "Four people take 1, 2, 7, and 10 minutes to cross a bridge. Only two can cross at a time with one torch. What is the minimum total time?",
    options: [
      { optionId: "A", text: "17 minutes" },
      { optionId: "B", text: "19 minutes" },
      { optionId: "C", text: "20 minutes" },
      { optionId: "D", text: "21 minutes" }
    ],
    answer: { correctOptionId: "A" },
    explanation: "Use the sequence 1+2, 1 back, 7+10, 2 back, 1+2 for a total of 17 minutes.",
    marks: 2,
    timeLimitSec: 75
  },
  {
    category: "logical-puzzles",
    topic: "clock-puzzle",
    difficulty: "hard",
    type: "mcq",
    question: "How many times do the hour and minute hands overlap in a 12-hour period?",
    options: [
      { optionId: "A", text: "10" },
      { optionId: "B", text: "11" },
      { optionId: "C", text: "12" },
      { optionId: "D", text: "13" }
    ],
    answer: { correctOptionId: "B" },
    explanation: "The hands overlap 11 times in 12 hours because one overlap is skipped between 11 and 12.",
    marks: 3,
    timeLimitSec: 75
  }
];

module.exports = questions;
