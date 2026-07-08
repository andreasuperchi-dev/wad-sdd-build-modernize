import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createQuizRouter } from "./quiz.route.js";

describe("quiz route", () => {
  it("returns deterministic quiz result payload", async () => {
    const app = express();
    app.use(express.json());
    app.use(
      createQuizRouter({
        getResult: async () => ({
          winningCategory: "Philosopher",
          scores: { Adventurer: 0, Comedian: 0, Philosopher: 10, Romantic: 0, "Zen Master": 0 },
          message: "You are a Philosopher duck!",
          duckDetailUrl: "/ducks/duck-philo-01",
          recommendedDuck: {
            id: "duck-philo-01",
            name: "Socratic Squeaker",
            category: "Philosopher",
            price: 19,
            tagline: "Questions everything",
          },
        }),
      } as never),
    );

    const response = await request(app).post("/quiz/result").send({ answers: { q1: "A", q2: "A", q3: "A", q4: "A", q5: "A" } });

    expect(response.status).toBe(200);
    expect(response.body.winningCategory).toBe("Philosopher");
  });

  it("maps invalid input errors to 400", async () => {
    const app = express();
    app.use(express.json());
    app.use(createQuizRouter({ getResult: async () => ({ status: 400, error: "Invalid or missing answer for q3" }) } as never));

    const response = await request(app).post("/quiz/result").send({ answers: { q1: "A" } });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("q3");
  });
});
