import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createFeaturedRouter } from "./featured.route.js";

describe("featured route", () => {
  it("returns featured duck payload", async () => {
    const app = express();
    app.use(
      createFeaturedRouter({
        getDuckOfTheDay: async () => ({
          date: "2026-07-08",
          duck: {
            id: "duck-1",
            name: "Lucky",
            category: "Philosopher",
            price: 10,
            tagline: "lucky",
          },
        }),
      } as never),
    );

    const response = await request(app).get("/ducks/featured");

    expect(response.status).toBe(200);
    expect(response.body.duck.id).toBe("duck-1");
  });

  it("returns fallback payload when pond is empty", async () => {
    const app = express();
    app.use(
      createFeaturedRouter({
        getDuckOfTheDay: async () => ({ date: "2026-07-08", message: "The pond is empty today, come back tomorrow." }),
      } as never),
    );

    const response = await request(app).get("/ducks/featured");

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("pond is empty");
  });
});
