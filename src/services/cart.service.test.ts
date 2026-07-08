import { describe, expect, it } from "vitest";

import { InMemoryCartStore } from "../data/cart.store.js";
import { type Duck } from "../domain/duck.js";
import {
  CartService,
  DUCK_NOT_FOUND_ERROR,
  INVALID_QUANTITY_ERROR,
  STOCK_EXCEEDED_ERROR,
  type CartDuckSource,
} from "./cart.service.js";

function createDuck(overrides: Partial<Duck> = {}): Duck {
  return {
    id: "duck-1",
    name: "Default Duck",
    category: "Debugging",
    price: 10,
    tagline: "Default tagline",
    description: "Default description",
    personalityTraits: ["default"],
    stock: 5,
    ...overrides,
  };
}

function makeSource(ducks: Duck[]): CartDuckSource {
  return {
    getAllDucks: async () => ducks,
  };
}

describe("CartService", () => {
  it("adds item with default quantity of 1", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "duck-a", price: 12 })]));

    const result = await service.addItem("sid-1", "duck-a");

    expect("status" in result).toBe(false);
    if ("status" in result) {
      return;
    }

    expect(result.items).toEqual([
      {
        duckId: "duck-a",
        name: "Default Duck",
        unitPrice: 12,
        quantity: 1,
        lineTotal: 12,
      },
    ]);
    expect(result.total).toBe(12);
  });

  it("increments existing quantity when adding the same duck again", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "duck-a", price: 9, stock: 10 })]));

    await service.addItem("sid-1", "duck-a", 2);
    const result = await service.addItem("sid-1", "duck-a", 3);

    expect("status" in result).toBe(false);
    if ("status" in result) {
      return;
    }

    expect(result.items[0]?.quantity).toBe(5);
    expect(result.total).toBe(45);
  });

  it("updates item quantity", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "duck-a", price: 7, stock: 8 })]));

    await service.addItem("sid-1", "duck-a", 2);
    const result = await service.updateItem("sid-1", "duck-a", 4);

    expect("status" in result).toBe(false);
    if ("status" in result) {
      return;
    }

    expect(result.items[0]?.quantity).toBe(4);
    expect(result.items[0]?.lineTotal).toBe(28);
    expect(result.total).toBe(28);
  });

  it("removes an item and returns updated cart", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "duck-a", price: 11 })]));

    await service.addItem("sid-1", "duck-a", 1);
    const result = await service.removeItem("sid-1", "duck-a");

    expect(result).toEqual({ items: [], total: 0 });
  });

  it("returns 409 when requested quantity exceeds stock", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "duck-a", stock: 3 })]));

    const result = await service.addItem("sid-1", "duck-a", 4);

    expect(result).toEqual({ status: 409, error: STOCK_EXCEEDED_ERROR });
  });

  it("returns 400 for invalid quantity values", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "duck-a", stock: 3 })]));

    const invalidAdd = await service.addItem("sid-1", "duck-a", 0);
    const invalidUpdate = await service.updateItem("sid-1", "duck-a", -1);

    expect(invalidAdd).toEqual({ status: 400, error: INVALID_QUANTITY_ERROR });
    expect(invalidUpdate).toEqual({ status: 400, error: INVALID_QUANTITY_ERROR });
  });

  it("returns 404 for unknown duck IDs", async () => {
    const service = new CartService(new InMemoryCartStore(), makeSource([createDuck({ id: "known-id" })]));

    const result = await service.addItem("sid-1", "missing-id", 1);

    expect(result).toEqual({ status: 404, error: DUCK_NOT_FOUND_ERROR });
  });

  it("computes deterministic line totals and cart total", async () => {
    const ducks = [
      createDuck({ id: "duck-a", name: "A", price: 2.5, stock: 10 }),
      createDuck({ id: "duck-b", name: "B", price: 3, stock: 10 }),
    ];
    const service = new CartService(new InMemoryCartStore(), makeSource(ducks));

    await service.addItem("sid-1", "duck-a", 2);
    await service.addItem("sid-1", "duck-b", 3);

    const result = await service.getCart("sid-1");

    expect(result.items).toEqual([
      { duckId: "duck-a", name: "A", unitPrice: 2.5, quantity: 2, lineTotal: 5 },
      { duckId: "duck-b", name: "B", unitPrice: 3, quantity: 3, lineTotal: 9 },
    ]);
    expect(result.total).toBe(14);
  });
});
