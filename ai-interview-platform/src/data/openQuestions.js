export const OPEN_QUESTIONS = [
  {
    id: "s2",
    title: "Design a URL Shortener",
    category: "System Design",
    difficulty: "medium",
    tags: ["system", "scalability"],
    companies: ["Uber", "Twitter"],
    description: `Design a URL shortening service like bit.ly or TinyURL.

The service should:
- Take a long URL and return a short URL (e.g. short.ly/abc123)
- Redirect users from the short URL to the original long URL
- Handle millions of requests per day
- Be highly available and low latency`,
    keyPoints: [
      "Estimate scale: reads vs writes ratio, storage needs",
      "API design: POST /shorten, GET /:shortCode",
      "Database choice: SQL vs NoSQL, schema design",
      "Encoding strategy: Base62, MD5 hash, counter-based",
      "Caching layer for popular URLs",
      "Load balancing and horizontal scaling",
    ],
    sampleAnswer: `**High-Level Design:**

1. **API Layer** — REST endpoints: POST /api/shorten (returns short code), GET /:code (redirects)

2. **Encoding** — Use Base62 (a-z, A-Z, 0-9) on an auto-incrementing ID. 6 characters = 62^6 ≈ 56 billion unique URLs.

3. **Database** — A simple key-value store (Redis for cache, Cassandra/DynamoDB for persistence). Schema: { shortCode, longUrl, createdAt, userId }

4. **Scale** — Read-heavy system (100:1 read/write). Cache top 20% of URLs (handles 80% of traffic). Use CDN for redirect responses.

5. **Availability** — Multiple app servers behind a load balancer. DB replication with read replicas.`,
    followUps: [
      "How would you handle custom aliases (e.g. short.ly/my-brand)?",
      "How do you prevent abuse / spam URLs?",
      "How would you add analytics (click counts, geo data)?",
      "What happens if two users shorten the same URL?",
    ],
  },
  {
    id: "s3",
    title: "React Hooks Deep-Dive",
    category: "Frontend",
    difficulty: "medium",
    tags: ["react", "hooks", "state"],
    companies: ["Meta", "Airbnb"],
    description: `Explain React Hooks in depth. Cover the motivation behind hooks, the most commonly used hooks, and the rules that govern their usage.

Be prepared to discuss:
- Why hooks were introduced
- useState, useEffect, useCallback, useMemo, useRef
- Custom hooks
- Common pitfalls`,
    keyPoints: [
      "Hooks solve the problem of reusing stateful logic between components",
      "Class components had issues: complex lifecycle methods, this binding, HOC hell",
      "useState — local state, returns [value, setter]",
      "useEffect — side effects, dependency array controls when it runs",
      "useCallback / useMemo — memoization to prevent unnecessary re-renders",
      "useRef — mutable ref that doesn't trigger re-render",
      "Custom hooks — extract and share stateful logic",
    ],
    sampleAnswer: `**Why Hooks?**
Before hooks, sharing stateful logic required HOCs or render props — both added wrapper hell. Hooks let you extract logic into reusable functions without changing component hierarchy.

**Key Hooks:**
- \`useState(initial)\` — returns [state, setState]. State updates are batched in React 18.
- \`useEffect(fn, deps)\` — runs after render. Empty deps = mount only. Return a cleanup function for subscriptions.
- \`useCallback(fn, deps)\` — memoizes a function reference. Use when passing callbacks to child components that use React.memo.
- \`useMemo(fn, deps)\` — memoizes a computed value. Use for expensive calculations.
- \`useRef(initial)\` — persists a mutable value across renders without causing re-renders. Also used to access DOM nodes.

**Rules of Hooks:**
1. Only call hooks at the top level (not inside loops, conditions, or nested functions)
2. Only call hooks from React function components or custom hooks

**Custom Hook Example:**
\`\`\`js
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
\`\`\``,
    followUps: [
      "What is the difference between useEffect and useLayoutEffect?",
      "When would you use useReducer over useState?",
      "How do you avoid stale closures in useEffect?",
      "What is the React Compiler and how does it change memoization?",
    ],
  },
  {
    id: "s5",
    title: "Tell Me About a Conflict",
    category: "Behavioral",
    difficulty: "easy",
    tags: ["leadership", "conflict"],
    companies: ["All companies"],
    description: `Tell me about a time you had a conflict with a teammate or manager. How did you handle it, and what was the outcome?

This is a behavioral question. Use the **STAR method**:
- **S**ituation — Set the context
- **T**ask — What was your responsibility?
- **A**ction — What did you specifically do?
- **R**esult — What was the outcome?`,
    keyPoints: [
      "Be specific — use a real example, not a hypothetical",
      "Show self-awareness — acknowledge your own role",
      "Focus on resolution, not blame",
      "Demonstrate communication and empathy",
      "End with a positive outcome or lesson learned",
    ],
    sampleAnswer: `**Situation:** During a sprint at my previous internship, a senior developer and I disagreed on the approach for a caching layer. They wanted to use Redis; I had researched an in-memory solution that would reduce infrastructure cost.

**Task:** I needed to either align with the team's direction or make a compelling case for my approach without damaging the relationship.

**Action:** Instead of pushing back in the standup, I prepared a short comparison doc — latency benchmarks, cost analysis, and maintenance overhead for both options. I asked for 15 minutes to walk through it together. I made it clear I was open to being wrong and just wanted the best outcome for the project.

**Result:** We ended up going with a hybrid approach — Redis for distributed caching but with my suggested eviction policy. The senior dev appreciated that I came with data rather than opinion. We shipped on time and the solution performed well under load.

**Lesson:** Technical disagreements are healthiest when they're about the problem, not the people. Data beats debate.`,
    followUps: [
      "What would you have done if they still disagreed after your presentation?",
      "Have you ever been wrong in a technical disagreement? How did you handle it?",
      "How do you handle conflict with someone more senior than you?",
    ],
  },
  {
    id: "s6",
    title: "Design Twitter Feed",
    category: "System Design",
    difficulty: "hard",
    tags: ["feed", "ranking", "system"],
    companies: ["Twitter", "Meta"],
    description: `Design the Twitter home timeline feed — the page users see when they log in, showing tweets from people they follow, ranked by relevance or recency.

Consider:
- Feed generation: push vs pull model
- Ranking and personalization
- Scale: 300M daily active users, 500M tweets/day
- Latency requirements: feed must load in < 200ms`,
    keyPoints: [
      "Fan-out on write (push) vs fan-out on read (pull) — hybrid for Twitter's scale",
      "Timeline service stores pre-computed feeds per user",
      "Ranking: recency, engagement signals, social graph proximity",
      "Hot users (celebrities) use pull model to avoid fan-out storms",
      "Caching: Redis sorted sets for timeline storage",
      "Media CDN for images/videos",
    ],
    sampleAnswer: `**Core Challenge:** Generating a personalized feed for 300M users in under 200ms.

**Approach — Hybrid Fan-out:**

*Write path:* When a regular user tweets, fan-out to all followers' timeline caches (push model). Store tweet IDs in Redis sorted sets keyed by userId, scored by timestamp.

*Read path:* When a celebrity (10M+ followers) tweets, don't fan-out. Instead, merge their tweets at read time (pull model). This avoids write amplification.

**Feed Generation:**
1. Fetch pre-computed timeline from Redis (tweet IDs)
2. Merge in celebrity tweets from a separate hot-user cache
3. Hydrate tweet IDs → full tweet objects from Tweet Service
4. Apply ranking model (ML-based: engagement prediction, recency, graph distance)

**Scale Numbers:**
- 500M tweets/day = ~5,800 tweets/sec
- Average 200 followers → 1.16B fan-out writes/sec (handled by async queue)
- Timeline cache: ~800 tweet IDs per user × 300M users = manageable with Redis cluster

**Storage:** Cassandra for tweets (write-heavy, time-series), Redis for timelines, S3+CDN for media.`,
    followUps: [
      "How would you handle a user who follows 10,000 accounts?",
      "How do you implement 'show new tweets' without a full page reload?",
      "How would you add a ranking model without increasing latency?",
      "How do you handle tweet deletion from already-generated feeds?",
    ],
  },
  {
    id: "s7",
    title: "Virtual DOM Explanation",
    category: "Frontend",
    difficulty: "easy",
    tags: ["react", "dom", "rendering"],
    companies: ["Meta", "Netflix"],
    description: `Explain what the Virtual DOM is, why React uses it, and how the reconciliation algorithm works.

Be prepared to discuss:
- What problem the Virtual DOM solves
- How diffing works
- React Fiber and its improvements
- When the Virtual DOM is NOT the fastest approach`,
    keyPoints: [
      "Real DOM manipulation is slow — layout, paint, composite are expensive",
      "Virtual DOM is a lightweight JS object tree representing the UI",
      "React diffs old vs new VDOM trees to find minimal set of real DOM changes",
      "Reconciliation uses heuristics: same type = update, different type = replace",
      "Keys help React identify list items across re-renders",
      "React Fiber: incremental rendering, priority-based updates, concurrent mode",
    ],
    sampleAnswer: `**The Problem:**
Direct DOM manipulation is expensive because every change can trigger layout recalculation, repaint, and composite — browser operations that block the main thread.

**Virtual DOM:**
React keeps a lightweight JavaScript object tree (the VDOM) that mirrors the real DOM. When state changes, React creates a new VDOM tree and diffs it against the previous one.

**Reconciliation Algorithm:**
React uses two heuristics to make diffing O(n) instead of O(n³):
1. Elements of different types produce different trees — React destroys and rebuilds
2. Keys help identify which list items changed, moved, or were removed

**Example:**
\`\`\`jsx
// Before
<ul><li key="a">A</li><li key="b">B</li></ul>
// After  
<ul><li key="b">B</li><li key="a">A</li></ul>
// React sees keys moved, not destroyed — reorders DOM nodes instead of recreating
\`\`\`

**React Fiber:**
Fiber rewrote the reconciliation engine to be incremental. Work is split into units that can be paused, prioritized, and resumed — enabling Concurrent Mode features like useTransition and Suspense.

**When VDOM is NOT fastest:**
For highly dynamic UIs (e.g. canvas games, real-time charts), direct DOM manipulation or libraries like Solid.js (which compile away the VDOM) can be faster.`,
    followUps: [
      "What is React Concurrent Mode and how does it improve UX?",
      "How does Svelte differ from React's approach?",
      "What is hydration and why can it be slow?",
      "When would you use shouldComponentUpdate or React.memo?",
    ],
  },
];
