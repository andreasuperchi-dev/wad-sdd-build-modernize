import { describe, expect, it } from "vitest";

import { createEmptyCart, isPositiveInteger } from "./cart.js";

describe("isPositiveInteger", () => {
  it("returns true for positive integers", () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(42)).toBe(true);
  });

  it("returns false for invalid quantity values", () => {
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isPositiveInteger(Number.NaN)).toBe(false);
    expect(isPositiveInteger("1")).toBe(false);
    expect(isPositiveInteger(null)).toBe(false);
    expect(isPositiveInteger(undefined)).toBe(false);
  });
});

describe("createEmptyCart", () => {
  it("creates a cart with no items", () => {
    const cart = createEmptyCart();

    expect(cart.items.size).toBe(0);
  });
});
