require("dotenv").config();
const mongoose = require("mongoose");
const VersantQuestion = require("../models/VersantQuestion");

const GRAMMAR = [
  { sentence: "He denied to accept the allegations made against him.", options: [{ id: "A", text: "He denied" }, { id: "B", text: "to accept" }, { id: "C", text: "the allegations" }, { id: "D", text: "made against him" }], correctOptionId: "B", explanation: "The correct phrase is 'denied accepting' — 'deny' takes a gerund, not an infinitive.", difficulty: "medium" },
  { sentence: "No sooner had the speech ended than the audience applauded.", options: [{ id: "A", text: "No sooner" }, { id: "B", text: "had the speech ended" }, { id: "C", text: "than" }, { id: "D", text: "No Error" }], correctOptionId: "D", explanation: "The sentence is grammatically correct.", difficulty: "medium" },
  { sentence: "She is one of those students who works very hard.", options: [{ id: "A", text: "She is" }, { id: "B", text: "one of those students" }, { id: "C", text: "who works" }, { id: "D", text: "very hard" }], correctOptionId: "C", explanation: "'who' refers to 'students' (plural), so it should be 'who work'.", difficulty: "medium" },
  { sentence: "The committee have reached their decision unanimously.", options: [{ id: "A", text: "The committee" }, { id: "B", text: "have reached" }, { id: "C", text: "their decision" }, { id: "D", text: "unanimously" }], correctOptionId: "B", explanation: "'Committee' is a collective noun treated as singular — 'has reached'.", difficulty: "hard" },
  { sentence: "Neither the manager nor the employees was present.", options: [{ id: "A", text: "Neither the manager" }, { id: "B", text: "nor the employees" }, { id: "C", text: "was present" }, { id: "D", text: "No Error" }], correctOptionId: "C", explanation: "With 'neither...nor', the verb agrees with the nearest subject ('employees') — 'were present'.", difficulty: "hard" },
  { sentence: "He is too clever to be deceived by such tricks.", options: [{ id: "A", text: "He is" }, { id: "B", text: "too clever" }, { id: "C", text: "to be deceived" }, { id: "D", text: "No Error" }], correctOptionId: "D", explanation: "The sentence is grammatically correct.", difficulty: "easy" },
  { sentence: "The news are very disturbing today.", options: [{ id: "A", text: "The news" }, { id: "B", text: "are" }, { id: "C", text: "very disturbing" }, { id: "D", text: "today" }], correctOptionId: "B", explanation: "'News' is uncountable and takes a singular verb — 'is'.", difficulty: "easy" },
  { sentence: "Each of the boys have done their homework.", options: [{ id: "A", text: "Each of" }, { id: "B", text: "the boys" }, { id: "C", text: "have done" }, { id: "D", text: "their homework" }], correctOptionId: "C", explanation: "'Each' is singular — 'has done'.", difficulty: "medium" },
  { sentence: "I look forward to meet you at the conference.", options: [{ id: "A", text: "I look forward" }, { id: "B", text: "to meet" }, { id: "C", text: "you at" }, { id: "D", text: "the conference" }], correctOptionId: "B", explanation: "'Look forward to' is followed by a gerund — 'to meeting'.", difficulty: "medium" },
  { sentence: "The police has arrested the suspect.", options: [{ id: "A", text: "The police" }, { id: "B", text: "has arrested" }, { id: "C", text: "the suspect" }, { id: "D", text: "No Error" }], correctOptionId: "B", explanation: "'Police' is a plural noun — 'have arrested'.", difficulty: "easy" },
  { sentence: "He is more smarter than his brother.", options: [{ id: "A", text: "He is" }, { id: "B", text: "more smarter" }, { id: "C", text: "than his" }, { id: "D", text: "brother" }], correctOptionId: "B", explanation: "Double comparative — should be 'smarter' or 'more smart'.", difficulty: "easy" },
  { sentence: "The data shows a clear upward trend.", options: [{ id: "A", text: "The data" }, { id: "B", text: "shows" }, { id: "C", text: "a clear" }, { id: "D", text: "No Error" }], correctOptionId: "D", explanation: "In modern usage, 'data' can take a singular verb.", difficulty: "hard" },
  { sentence: "Between you and I, this plan will fail.", options: [{ id: "A", text: "Between you" }, { id: "B", text: "and I" }, { id: "C", text: "this plan" }, { id: "D", text: "will fail" }], correctOptionId: "B", explanation: "After a preposition, use object pronoun — 'between you and me'.", difficulty: "medium" },
  { sentence: "She suggested that he should goes to the doctor.", options: [{ id: "A", text: "She suggested" }, { id: "B", text: "that he" }, { id: "C", text: "should goes" }, { id: "D", text: "to the doctor" }], correctOptionId: "C", explanation: "After modal 'should', use base form — 'should go'.", difficulty: "easy" },
  { sentence: "The bouquet of flowers were placed on the table.", options: [{ id: "A", text: "The bouquet" }, { id: "B", text: "of flowers" }, { id: "C", text: "were placed" }, { id: "D", text: "on the table" }], correctOptionId: "C", explanation: "The subject is 'bouquet' (singular) — 'was placed'.", difficulty: "medium" },
  { sentence: "He has been working here since three years.", options: [{ id: "A", text: "He has been" }, { id: "B", text: "working here" }, { id: "C", text: "since three years" }, { id: "D", text: "No Error" }], correctOptionId: "C", explanation: "Use 'for' with a period of time — 'for three years'.", difficulty: "easy" },
  { sentence: "Hardly had she entered when the phone rang.", options: [{ id: "A", text: "Hardly had she" }, { id: "B", text: "entered" }, { id: "C", text: "when the phone" }, { id: "D", text: "No Error" }], correctOptionId: "D", explanation: "The sentence is grammatically correct.", difficulty: "hard" },
  { sentence: "The teacher along with students are going on a trip.", options: [{ id: "A", text: "The teacher" }, { id: "B", text: "along with students" }, { id: "C", text: "are going" }, { id: "D", text: "on a trip" }], correctOptionId: "C", explanation: "'Along with' does not change the subject — 'is going'.", difficulty: "medium" },
  { sentence: "I am used to work late at night.", options: [{ id: "A", text: "I am" }, { id: "B", text: "used to" }, { id: "C", text: "work late" }, { id: "D", text: "at night" }], correctOptionId: "C", explanation: "'Used to' (habit) takes a gerund — 'working late'.", difficulty: "medium" },
  { sentence: "He spoke to the audience with great eloquence.", options: [{ id: "A", text: "He spoke" }, { id: "B", text: "to the audience" }, { id: "C", text: "with great eloquence" }, { id: "D", text: "No Error" }], correctOptionId: "D", explanation: "The sentence is grammatically correct.", difficulty: "easy" },
];

const READING_PASSAGES = [
  {
    title: "Wireless Power Transfer",
    category: "Technology",
    difficulty: "medium",
    passage: "Wireless power transfer transmits electricity without physical connections through electromagnetic fields. Applications include smartphone charging pads, electric vehicle charging, and medical implants. Technologies include inductive coupling for short distances and resonant coupling extending range. Future possibilities include room-sized charging zones eliminating cables entirely. However, efficiency decreases with distance, safety concerns about electromagnetic exposure persist, and standardization challenges hinder adoption. Despite limitations, wireless power promises convenience and enables applications impossible with wired connections. As technology matures, wireless charging may become ubiquitous, fundamentally changing how we power devices and interact with electrical infrastructure.",
    questions: [
      { question: "How does wireless power transfer work?", options: [{ id: "A", text: "Through physical cables" }, { id: "B", text: "Through electromagnetic fields" }, { id: "C", text: "Through sound waves" }, { id: "D", text: "Through water pipes" }], correctOptionId: "B", explanation: "The passage states it transmits electricity through electromagnetic fields." },
      { question: "Which technology is used for short-distance wireless charging?", options: [{ id: "A", text: "Resonant coupling" }, { id: "B", text: "Microwave transmission" }, { id: "C", text: "Inductive coupling" }, { id: "D", text: "Laser transfer" }], correctOptionId: "C", explanation: "Inductive coupling is mentioned for short distances." },
      { question: "What is a major limitation of wireless power transfer?", options: [{ id: "A", text: "It only works indoors" }, { id: "B", text: "Efficiency decreases with distance" }, { id: "C", text: "It requires special metals" }, { id: "D", text: "It only charges one device at a time" }], correctOptionId: "B", explanation: "The passage explicitly states efficiency decreases with distance." },
      { question: "What future possibility is mentioned in the passage?", options: [{ id: "A", text: "Wireless internet" }, { id: "B", text: "Room-sized charging zones" }, { id: "C", text: "Wireless water supply" }, { id: "D", text: "Satellite charging" }], correctOptionId: "B", explanation: "Room-sized charging zones eliminating cables are mentioned as a future possibility." },
      { question: "What challenge hinders adoption of wireless power?", options: [{ id: "A", text: "High cost of copper" }, { id: "B", text: "Lack of consumer interest" }, { id: "C", text: "Standardization challenges" }, { id: "D", text: "Government regulations" }], correctOptionId: "C", explanation: "Standardization challenges are explicitly mentioned." },
    ],
  },
  {
    title: "Coral Bleaching Crisis",
    category: "Environment",
    difficulty: "hard",
    passage: "Coral bleaching occurs when water temperatures rise, causing corals to expel the symbiotic algae living in their tissues. Without these algae, corals turn white and become vulnerable to disease and death. The Great Barrier Reef has experienced multiple mass bleaching events in recent decades, driven primarily by climate change. Ocean acidification compounds the problem by weakening coral skeletons. While some corals can recover if temperatures normalize quickly, repeated bleaching events prevent full recovery. Scientists are exploring heat-resistant coral strains and assisted evolution techniques. However, without significant reductions in greenhouse gas emissions, coral reefs face an uncertain future, threatening the biodiversity they support and the coastal communities that depend on them.",
    questions: [
      { question: "What causes coral bleaching?", options: [{ id: "A", text: "Water pollution" }, { id: "B", text: "Rising water temperatures" }, { id: "C", text: "Overfishing" }, { id: "D", text: "Underwater earthquakes" }], correctOptionId: "B", explanation: "Rising water temperatures cause corals to expel symbiotic algae." },
      { question: "What do corals expel during bleaching?", options: [{ id: "A", text: "Calcium carbonate" }, { id: "B", text: "Carbon dioxide" }, { id: "C", text: "Symbiotic algae" }, { id: "D", text: "Salt crystals" }], correctOptionId: "C", explanation: "Corals expel the symbiotic algae living in their tissues." },
      { question: "What compounds the bleaching problem?", options: [{ id: "A", text: "Ocean acidification" }, { id: "B", text: "Plastic pollution" }, { id: "C", text: "Noise pollution" }, { id: "D", text: "Oil spills" }], correctOptionId: "A", explanation: "Ocean acidification weakens coral skeletons, compounding the problem." },
      { question: "What are scientists exploring to help corals?", options: [{ id: "A", text: "Artificial coral reefs" }, { id: "B", text: "Heat-resistant coral strains" }, { id: "C", text: "Underwater cooling systems" }, { id: "D", text: "Chemical treatments" }], correctOptionId: "B", explanation: "Scientists are exploring heat-resistant coral strains and assisted evolution." },
      { question: "What is the primary driver of bleaching events?", options: [{ id: "A", text: "Tourism" }, { id: "B", text: "Fishing practices" }, { id: "C", text: "Climate change" }, { id: "D", text: "Natural cycles" }], correctOptionId: "C", explanation: "Climate change is identified as the primary driver." },
    ],
  },
  {
    title: "Brain-Computer Interfaces",
    category: "Technology",
    difficulty: "hard",
    passage: "Brain-computer interfaces (BCIs) create direct communication pathways between the brain and external devices. Invasive BCIs, like Neuralink's implants, offer high signal resolution but require surgery. Non-invasive options like EEG headsets are safer but less precise. Medical applications include restoring movement to paralyzed patients and treating neurological disorders. BCIs have enabled paralyzed individuals to control robotic arms and communicate through thought alone. Beyond medicine, BCIs could enhance human cognition, enable direct brain-to-brain communication, and create immersive virtual reality experiences. Ethical concerns include privacy of thoughts, potential for cognitive enhancement inequality, and the blurring of human-machine boundaries. Regulatory frameworks are still developing to address these unprecedented challenges.",
    questions: [
      { question: "What do brain-computer interfaces create?", options: [{ id: "A", text: "Artificial neurons" }, { id: "B", text: "Direct communication between brain and devices" }, { id: "C", text: "New brain cells" }, { id: "D", text: "Wireless internet connections" }], correctOptionId: "B", explanation: "BCIs create direct communication pathways between the brain and external devices." },
      { question: "What is a disadvantage of invasive BCIs?", options: [{ id: "A", text: "Low signal resolution" }, { id: "B", text: "High cost" }, { id: "C", text: "Require surgery" }, { id: "D", text: "Limited range" }], correctOptionId: "C", explanation: "Invasive BCIs require surgery, though they offer high signal resolution." },
      { question: "Which medical application is mentioned?", options: [{ id: "A", text: "Curing cancer" }, { id: "B", text: "Restoring movement to paralyzed patients" }, { id: "C", text: "Improving eyesight" }, { id: "D", text: "Treating infections" }], correctOptionId: "B", explanation: "Restoring movement to paralyzed patients is explicitly mentioned." },
      { question: "What ethical concern is raised?", options: [{ id: "A", text: "Environmental impact" }, { id: "B", text: "Privacy of thoughts" }, { id: "C", text: "Battery life" }, { id: "D", text: "Signal interference" }], correctOptionId: "B", explanation: "Privacy of thoughts is listed as an ethical concern." },
      { question: "What is the state of regulatory frameworks for BCIs?", options: [{ id: "A", text: "Fully established" }, { id: "B", text: "Not needed" }, { id: "C", text: "Still developing" }, { id: "D", text: "Internationally standardized" }], correctOptionId: "C", explanation: "Regulatory frameworks are still developing." },
    ],
  },
];

const LISTENING_PASSAGES = [
  {
    title: "Confirmation Bias Effect",
    category: "Psychology",
    difficulty: "medium",
    passage: "Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's preexisting beliefs. This cognitive bias affects decision-making in everyday life, from political opinions to medical diagnoses. People unconsciously favor information that supports their existing views while dismissing contradictory evidence. Social media algorithms amplify this effect by creating echo chambers. Overcoming confirmation bias requires actively seeking disconfirming evidence, engaging with diverse perspectives, and practicing intellectual humility. Critical thinking training and structured decision-making processes can help mitigate its effects in professional settings.",
    questions: [
      { question: "What is confirmation bias?", options: [{ id: "A", text: "A tendency to seek new information" }, { id: "B", text: "A tendency to confirm preexisting beliefs" }, { id: "C", text: "A form of memory loss" }, { id: "D", text: "A decision-making strategy" }], correctOptionId: "B", explanation: "Confirmation bias is the tendency to confirm preexisting beliefs." },
      { question: "How do social media algorithms relate to confirmation bias?", options: [{ id: "A", text: "They reduce it" }, { id: "B", text: "They have no effect" }, { id: "C", text: "They amplify it through echo chambers" }, { id: "D", text: "They eliminate it" }], correctOptionId: "C", explanation: "Social media algorithms amplify confirmation bias by creating echo chambers." },
      { question: "What helps overcome confirmation bias?", options: [{ id: "A", text: "Avoiding all media" }, { id: "B", text: "Seeking disconfirming evidence" }, { id: "C", text: "Trusting your instincts" }, { id: "D", text: "Reading more news" }], correctOptionId: "B", explanation: "Actively seeking disconfirming evidence helps overcome confirmation bias." },
      { question: "Where does confirmation bias affect decision-making?", options: [{ id: "A", text: "Only in politics" }, { id: "B", text: "Only in medicine" }, { id: "C", text: "In everyday life including politics and medicine" }, { id: "D", text: "Only in academic settings" }], correctOptionId: "C", explanation: "It affects decision-making in everyday life, from political opinions to medical diagnoses." },
      { question: "What professional tool can mitigate confirmation bias?", options: [{ id: "A", text: "Meditation" }, { id: "B", text: "Structured decision-making processes" }, { id: "C", text: "Group voting" }, { id: "D", text: "Intuition training" }], correctOptionId: "B", explanation: "Structured decision-making processes can help mitigate confirmation bias." },
    ],
  },
  {
    title: "Growth Mindset Power",
    category: "Psychology",
    difficulty: "easy",
    passage: "Carol Dweck's research on growth mindset shows that believing abilities can be developed through dedication and hard work leads to greater achievement. People with a fixed mindset believe talents are innate and avoid challenges that might reveal limitations. Growth mindset individuals embrace challenges as learning opportunities. Schools implementing growth mindset programs see improved student resilience and academic performance. Praising effort rather than intelligence encourages growth mindset development. Organizations adopting growth mindset cultures show greater innovation and employee engagement. The key insight is that the brain is plastic — it can grow and change throughout life with the right experiences and attitudes.",
    questions: [
      { question: "Who researched growth mindset?", options: [{ id: "A", text: "Albert Bandura" }, { id: "B", text: "Carol Dweck" }, { id: "C", text: "Abraham Maslow" }, { id: "D", text: "B.F. Skinner" }], correctOptionId: "B", explanation: "Carol Dweck's research is specifically mentioned." },
      { question: "What do fixed mindset people believe?", options: [{ id: "A", text: "Abilities can be developed" }, { id: "B", text: "Talents are innate" }, { id: "C", text: "Hard work is everything" }, { id: "D", text: "Challenges are opportunities" }], correctOptionId: "B", explanation: "Fixed mindset people believe talents are innate." },
      { question: "What type of praise encourages growth mindset?", options: [{ id: "A", text: "Praising intelligence" }, { id: "B", text: "Praising results" }, { id: "C", text: "Praising effort" }, { id: "D", text: "Praising speed" }], correctOptionId: "C", explanation: "Praising effort rather than intelligence encourages growth mindset." },
      { question: "What does brain plasticity mean?", options: [{ id: "A", text: "The brain is made of plastic" }, { id: "B", text: "The brain cannot change" }, { id: "C", text: "The brain can grow and change throughout life" }, { id: "D", text: "The brain shrinks with age" }], correctOptionId: "C", explanation: "Brain plasticity means the brain can grow and change throughout life." },
      { question: "What do organizations with growth mindset culture show?", options: [{ id: "A", text: "Higher profits only" }, { id: "B", text: "Greater innovation and employee engagement" }, { id: "C", text: "Fewer employees" }, { id: "D", text: "Stricter rules" }], correctOptionId: "B", explanation: "Organizations show greater innovation and employee engagement." },
    ],
  },
  {
    title: "Financial Literacy Importance",
    category: "Economics",
    difficulty: "easy",
    passage: "Financial literacy — the ability to understand and effectively use financial skills — is increasingly recognized as essential for personal and societal wellbeing. Studies show that financially literate individuals make better investment decisions, accumulate more wealth, and are better prepared for retirement. Despite its importance, financial literacy rates remain low globally, with many adults unable to perform basic calculations involving interest rates or inflation. Schools are beginning to incorporate personal finance education, but coverage remains inconsistent. Digital tools and apps are democratizing access to financial education. Improving financial literacy can reduce wealth inequality, decrease personal debt levels, and strengthen economic resilience at both individual and national levels.",
    questions: [
      { question: "What is financial literacy?", options: [{ id: "A", text: "The ability to earn money" }, { id: "B", text: "Understanding and using financial skills effectively" }, { id: "C", text: "Knowledge of tax laws" }, { id: "D", text: "Ability to invest in stocks" }], correctOptionId: "B", explanation: "Financial literacy is the ability to understand and effectively use financial skills." },
      { question: "What do financially literate individuals do better?", options: [{ id: "A", text: "Spend more money" }, { id: "B", text: "Avoid all investments" }, { id: "C", text: "Make better investment decisions" }, { id: "D", text: "Earn higher salaries" }], correctOptionId: "C", explanation: "They make better investment decisions and accumulate more wealth." },
      { question: "What is the current state of financial literacy globally?", options: [{ id: "A", text: "Very high" }, { id: "B", text: "Improving rapidly" }, { id: "C", text: "Remains low" }, { id: "D", text: "Only low in developing countries" }], correctOptionId: "C", explanation: "Financial literacy rates remain low globally." },
      { question: "What are digital tools doing for financial education?", options: [{ id: "A", text: "Making it more expensive" }, { id: "B", text: "Democratizing access" }, { id: "C", text: "Replacing schools" }, { id: "D", text: "Limiting access" }], correctOptionId: "B", explanation: "Digital tools are democratizing access to financial education." },
      { question: "What can improving financial literacy reduce?", options: [{ id: "A", text: "Economic growth" }, { id: "B", text: "Employment rates" }, { id: "C", text: "Wealth inequality and personal debt" }, { id: "D", text: "Government spending" }], correctOptionId: "C", explanation: "It can reduce wealth inequality and decrease personal debt levels." },
    ],
  },
];

const SPEAKING_PROMPTS = [
  { prompt: "Describe a challenge you overcame and what you learned from it.", sampleAnswer: "A strong answer describes a specific challenge, explains the steps taken to overcome it, and reflects on the lessons learned. Use clear structure: situation, action, result.", difficulty: "medium", topic: "Personal Growth" },
  { prompt: "What is the most important skill for success in the modern workplace?", sampleAnswer: "A strong answer identifies a specific skill (e.g., adaptability, communication), provides reasoning, and supports with examples.", difficulty: "medium", topic: "Career" },
  { prompt: "Should social media platforms be regulated by governments? Give your opinion.", sampleAnswer: "A strong answer presents a clear stance, provides at least two supporting arguments, and acknowledges the opposing view.", difficulty: "hard", topic: "Technology & Society" },
  { prompt: "Describe your hometown and what makes it special.", sampleAnswer: "A strong answer includes geographic details, cultural aspects, personal memories, and what distinguishes the place from others.", difficulty: "easy", topic: "Personal" },
  { prompt: "What are the advantages and disadvantages of remote work?", sampleAnswer: "A strong answer covers flexibility and productivity benefits, then addresses isolation and collaboration challenges, with a balanced conclusion.", difficulty: "medium", topic: "Work" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await VersantQuestion.deleteMany({});
    console.log("Cleared existing versant questions");

    const grammarDocs = GRAMMAR.map((g) => ({
      type: "grammar",
      difficulty: g.difficulty,
      topic: "Grammar",
      category: "English",
      sentence: g.sentence,
      options: g.options,
      correctOptionId: g.correctOptionId,
      explanation: g.explanation,
    }));

    const readingDocs = READING_PASSAGES.map((r) => ({
      type: "reading",
      difficulty: r.difficulty,
      topic: r.title,
      category: r.category,
      title: r.title,
      passage: r.passage,
      questions: r.questions,
    }));

    const listeningDocs = LISTENING_PASSAGES.map((l) => ({
      type: "listening",
      difficulty: l.difficulty,
      topic: l.title,
      category: l.category,
      title: l.title,
      passage: l.passage, // stored in DB but NOT sent to frontend for listening mode
      questions: l.questions,
    }));

    const speakingDocs = SPEAKING_PROMPTS.map((s) => ({
      type: "speaking",
      difficulty: s.difficulty,
      topic: s.topic,
      category: "Speaking",
      prompt: s.prompt,
      sampleAnswer: s.sampleAnswer,
    }));

    const all = [...grammarDocs, ...readingDocs, ...listeningDocs, ...speakingDocs];
    await VersantQuestion.insertMany(all);
    console.log(`Seeded ${all.length} versant questions`);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
