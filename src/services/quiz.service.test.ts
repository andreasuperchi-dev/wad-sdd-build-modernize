import { describe, expect, it } from "vitest";

import { QuizService, resolveWinningCategory, scoreAnswers } from "./quiz.service.js";

describe("QuizService", () => {
  it("returns deterministic result for identical answers", async () => {
    const service = new QuizService({
      getAllDucks: async () => [
        {
          id: "duck-philo-01",
          name: "Socratic Squeaker",
          category: "Philosopher",
          price: 19,
          tagline: "Questions everything",
          description: "desc",
          personalityTraits: ["curious"],
          stock: 2,
        },
      ],
    });

    const payload = { answers: { q1: "A", q2: "A", q3: "A", q4: "A", q5: "A" } };
    const first = await service.getResult(payload);
    const second = await service.getResult(payload);

    expect(first).toEqual(second);
  });

  it("returns 400 for missing answers", async () => {
    const service = new QuizService({ getAllDucks: async () => [] });
    const result = await service.getResult({ answers: { q1: "A" } });

    expect("status" in result && result.status === 400).toBe(true);
  });

  it("applies alphabetical tie-break", () => {
    const winner = resolveWinningCategory({
      Adventurer: 6,
      Comedian: 1,
      Philosopher: 6,
      Romantic: 0,
      "Zen Master": 0,
    });

    expect(winner).toBe("Adventurer");
  });

  it("scores answers by configured weights", () => {
    const scores = scoreAnswers({ q1: "A", q2: "B", q3: "C", q4: "D", q5: "E" });

    expect(scores.Philosopher).toBe(2);
    expect(scores.Adventurer).toBe(2);
    expect(scores.Romantic).toBe(2);
    expect(scores.Comedian).toBe(2);
    expect(scores["Zen Master"]).toBe(2);
  });
});
