import { CatalogRepository } from "../data/catalog.repository.js";
import type { CatalogItem, Duck } from "../domain/duck.js";
import {
  QUIZ_CATEGORIES,
  QUIZ_QUESTIONS,
  type QuizAnswers,
  type QuizCategory,
  type QuizError,
  type QuizQuestionId,
  type QuizResult,
  type QuizSubmission,
  isQuizOptionId,
} from "../domain/quiz.js";

export type QuizDuckSource = {
  getAllDucks(): Promise<Duck[]>;
};

const QUESTION_IDS: QuizQuestionId[] = ["q1", "q2", "q3", "q4", "q5"];

export class QuizService {
  constructor(private readonly duckSource: QuizDuckSource = new CatalogRepository()) {}

  getQuestions() {
    return QUIZ_QUESTIONS;
  }

  async getResult(payload: unknown): Promise<QuizResult | QuizError> {
    const parsed = parseSubmission(payload);
    if ("status" in parsed) {
      return parsed;
    }

    const scores = scoreAnswers(parsed.answers);
    const winningCategory = resolveWinningCategory(scores);

    const ducks = await this.duckSource.getAllDucks();
    const recommendedDuck = ducks
      .filter((duck) => duck.stock > 0 && duck.category === winningCategory)
      .sort((a, b) => a.id.localeCompare(b.id))[0];

    if (!recommendedDuck) {
      return {
        winningCategory,
        scores,
        message: `You match ${winningCategory}, but no in-stock duck is available right now.`,
        duckDetailUrl: null,
        recommendedDuck: null,
      };
    }

    return {
      winningCategory,
      scores,
      message: `You are a ${winningCategory} duck!`,
      duckDetailUrl: `/ducks/${recommendedDuck.id}`,
      recommendedDuck: toCatalogItem(recommendedDuck),
    };
  }
}

function toCatalogItem(duck: Duck): CatalogItem {
  return {
    id: duck.id,
    name: duck.name,
    category: duck.category,
    price: duck.price,
    tagline: duck.tagline,
  };
}

function parseSubmission(payload: unknown): QuizSubmission | QuizError {
  if (typeof payload !== "object" || payload === null) {
    return { status: 400, error: "Invalid payload" };
  }

  const answers = (payload as { answers?: unknown }).answers;
  if (typeof answers !== "object" || answers === null) {
    return { status: 400, error: "answers object is required" };
  }

  const parsedAnswers = {} as QuizAnswers;

  for (const questionId of QUESTION_IDS) {
    const value = (answers as Record<string, unknown>)[questionId];
    if (typeof value !== "string" || !isQuizOptionId(value)) {
      return { status: 400, error: `Invalid or missing answer for ${questionId}` };
    }
    parsedAnswers[questionId] = value;
  }

  return { answers: parsedAnswers };
}

function scoreAnswers(answers: QuizAnswers): Record<QuizCategory, number> {
  const scores: Record<QuizCategory, number> = {
    Adventurer: 0,
    Comedian: 0,
    Philosopher: 0,
    Romantic: 0,
    "Zen Master": 0,
  };

  for (const question of QUIZ_QUESTIONS) {
    const selected = question.options.find((option) => option.id === answers[question.id]);
    if (!selected) {
      continue;
    }

    for (const category of QUIZ_CATEGORIES) {
      scores[category] += selected.weights[category];
    }
  }

  return scores;
}

function resolveWinningCategory(scores: Record<QuizCategory, number>): QuizCategory {
  const maxScore = Math.max(...Object.values(scores));
  const tied = QUIZ_CATEGORIES.filter((category) => scores[category] === maxScore);
  const sorted = [...tied].sort((a, b) => a.localeCompare(b));
  return sorted[0] ?? "Adventurer";
}

export { resolveWinningCategory, scoreAnswers };
