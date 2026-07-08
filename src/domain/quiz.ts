import type { CatalogItem } from "./duck.js";

export const QUIZ_CATEGORIES = ["Adventurer", "Comedian", "Philosopher", "Romantic", "Zen Master"] as const;

export type QuizCategory = (typeof QUIZ_CATEGORIES)[number];
export type QuizOptionId = "A" | "B" | "C" | "D" | "E";
export type QuizQuestionId = "q1" | "q2" | "q3" | "q4" | "q5";

export type QuizOption = {
  id: QuizOptionId;
  text: string;
  weights: Record<QuizCategory, number>;
};

export type QuizQuestion = {
  id: QuizQuestionId;
  prompt: string;
  options: QuizOption[];
};

export type QuizAnswers = Record<QuizQuestionId, QuizOptionId>;

export type QuizSubmission = {
  answers: QuizAnswers;
};

export type QuizResult = {
  winningCategory: QuizCategory;
  scores: Record<QuizCategory, number>;
  message: string;
  duckDetailUrl: string | null;
  recommendedDuck: CatalogItem | null;
};

export type QuizError = { status: 400; error: string };

const zeroWeights: Record<QuizCategory, number> = {
  Adventurer: 0,
  Comedian: 0,
  Philosopher: 0,
  Romantic: 0,
  "Zen Master": 0,
};

function weightsFor(category: QuizCategory): Record<QuizCategory, number> {
  return { ...zeroWeights, [category]: 2 };
}

const DEFAULT_OPTIONS: Array<{ id: QuizOptionId; category: QuizCategory }> = [
  { id: "A", category: "Philosopher" },
  { id: "B", category: "Adventurer" },
  { id: "C", category: "Romantic" },
  { id: "D", category: "Comedian" },
  { id: "E", category: "Zen Master" },
];

const PROMPTS: Record<QuizQuestionId, string> = {
  q1: "Your ideal Saturday involves:",
  q2: "In a group project, you naturally become:",
  q3: "Your social media feed is mostly:",
  q4: "When choosing a gift, you:",
  q5: "Your approach to a rainy afternoon is:",
};

export const QUIZ_QUESTIONS: QuizQuestion[] = (Object.keys(PROMPTS) as QuizQuestionId[]).map((id) => ({
  id,
  prompt: PROMPTS[id],
  options: DEFAULT_OPTIONS.map((option) => ({
    id: option.id,
    text: option.category,
    weights: weightsFor(option.category),
  })),
}));

export function isQuizQuestionId(value: string): value is QuizQuestionId {
  return value === "q1" || value === "q2" || value === "q3" || value === "q4" || value === "q5";
}

export function isQuizOptionId(value: string): value is QuizOptionId {
  return value === "A" || value === "B" || value === "C" || value === "D" || value === "E";
}
