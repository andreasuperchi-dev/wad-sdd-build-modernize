import { describe, expect, it } from "vitest";

import { isCatalogItem, isDuck, type Duck } from "./duck.js";

describe("isDuck", () => {
  it("returns true for a valid duck payload", () => {
    const validDuck: Duck = {
      id: "duck-debug-01",
      name: "Debugger Duck",
      category: "Debugging",
      price: 12.5,
      tagline: "Silent, patient, mildly judgmental.",
      description: "A classic companion for explaining your code out loud.",
      personalityTraits: ["patient", "focused", "stoic"],
      stock: 7,
    };

    expect(isDuck(validDuck)).toBe(true);
  });

  it("returns false when required fields are missing or invalid", () => {
    const invalidDuck = {
      id: "duck-bad-01",
      name: "Broken Duck",
      category: "Debugging",
      price: "12.5",
      tagline: "Oops",
      description: "Not quite right",
      personalityTraits: ["quirky"],
      stock: 1,
    };

    expect(isDuck(invalidDuck)).toBe(false);
  });
});

describe("isCatalogItem", () => {
  it("returns true for a valid catalog item payload", () => {
    const validCatalogItem = {
      id: "duck-zen-01",
      name: "Zen Duck",
      category: "Wellness",
      price: 19,
      tagline: "Breathe in. Compile out.",
    };

    expect(isCatalogItem(validCatalogItem)).toBe(true);
  });

  it("returns false for non-object values", () => {
    expect(isCatalogItem(null)).toBe(false);
    expect(isCatalogItem("duck")).toBe(false);
  });
});
