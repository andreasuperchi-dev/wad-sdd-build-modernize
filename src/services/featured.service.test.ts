import { describe, expect, it } from "vitest";

import { FeaturedService, dateSeed, toDateString } from "./featured.service.js";

describe("FeaturedService", () => {
  it("returns same duck for the same day", async () => {
    const service = new FeaturedService({
      getAllDucks: async () => [
        {
          id: "duck-a",
          name: "A",
          category: "Debugging",
          price: 10,
          tagline: "A",
          description: "A",
          personalityTraits: ["a"],
          stock: 1,
        },
        {
          id: "duck-b",
          name: "B",
          category: "Debugging",
          price: 10,
          tagline: "B",
          description: "B",
          personalityTraits: ["b"],
          stock: 2,
        },
      ],
    });

    const date = new Date("2026-07-08T10:00:00");
    const first = await service.getDuckOfTheDay(date);
    const second = await service.getDuckOfTheDay(date);

    expect(first).toEqual(second);
  });

  it("returns fallback when all ducks are sold out", async () => {
    const service = new FeaturedService({
      getAllDucks: async () => [
        {
          id: "duck-a",
          name: "A",
          category: "Debugging",
          price: 10,
          tagline: "A",
          description: "A",
          personalityTraits: ["a"],
          stock: 0,
        },
      ],
    });

    const result = await service.getDuckOfTheDay(new Date("2026-07-08T10:00:00"));
    expect("message" in result).toBe(true);
  });

  it("exposes deterministic date utilities", () => {
    expect(toDateString(new Date("2026-07-08T01:30:00"))).toBe("2026-07-08");
    expect(dateSeed("2026-07-08")).toBe(20260708);
  });
});
