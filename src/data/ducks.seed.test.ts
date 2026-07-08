import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { isDuck } from "../domain/duck.js";

const seedFilePath = fileURLToPath(new URL("./ducks.seed.json", import.meta.url));

describe("ducks.seed.json", () => {
  it("contains at least 10 ducks across at least 3 categories", async () => {
    const raw = await readFile(seedFilePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    expect(Array.isArray(parsed)).toBe(true);
    if (!Array.isArray(parsed)) {
      return;
    }

    expect(parsed.length).toBeGreaterThanOrEqual(10);

    const categories = new Set(
      parsed
        .filter((item): item is { category: unknown } => typeof item === "object" && item !== null && "category" in item)
        .map((item) => item.category)
        .filter((value): value is string => typeof value === "string"),
    );

    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  it("contains only valid Duck records with required fields and types", async () => {
    const raw = await readFile(seedFilePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    expect(Array.isArray(parsed)).toBe(true);
    if (!Array.isArray(parsed)) {
      return;
    }

    for (const record of parsed) {
      expect(isDuck(record)).toBe(true);
    }
  });
});
