import { describe, expect, it } from "vitest";

import { EMPTY_CATALOG_MESSAGE, CatalogService, type DuckSource } from "./catalog.service.js";
import { type Duck } from "../domain/duck.js";

function createDuck(overrides: Partial<Duck> = {}): Duck {
  return {
    id: "duck-1",
    name: "Default Duck",
    category: "Debugging",
    price: 10,
    tagline: "Default tagline",
    description: "Default description",
    personalityTraits: ["default"],
    stock: 1,
    ...overrides,
  };
}

function makeSource(ducks: Duck[]): DuckSource {
  return {
    getAllDucks: async () => ducks,
  };
}

describe("CatalogService", () => {
  it("filters out ducks with stock less than or equal to 0", async () => {
    const source = makeSource([
      createDuck({ id: "in-stock-1", stock: 5 }),
      createDuck({ id: "out-of-stock", stock: 0 }),
      createDuck({ id: "negative-stock", stock: -1 }),
      createDuck({ id: "in-stock-2", stock: 2 }),
    ]);

    const service = new CatalogService(source);

    const result = await service.getAvailableCatalogItems();

    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.id)).toEqual(["in-stock-1", "in-stock-2"]);
  });

  it("maps ducks to catalog items with required fields only", async () => {
    const source = makeSource([
      createDuck({
        id: "catalog-shape-1",
        name: "Shape Duck",
        category: "Wellness",
        price: 22.5,
        tagline: "Only the required fields survive.",
        description: "Should not appear in catalog item",
        personalityTraits: ["detailed"],
        stock: 6,
      }),
    ]);

    const service = new CatalogService(source);

    const result = await service.getAvailableCatalogItems();

    const firstItem = result.items[0];

    expect(firstItem).toEqual({
      id: "catalog-shape-1",
      name: "Shape Duck",
      category: "Wellness",
      price: 22.5,
      tagline: "Only the required fields survive.",
    });
    expect(firstItem).toBeDefined();
    if (!firstItem) {
      return;
    }

    expect("description" in firstItem).toBe(false);
    expect("personalityTraits" in firstItem).toBe(false);
    expect("stock" in firstItem).toBe(false);
  });

  it("preserves deterministic order from source data", async () => {
    const source = makeSource([
      createDuck({ id: "third", stock: 2 }),
      createDuck({ id: "first", stock: 0 }),
      createDuck({ id: "second", stock: 4 }),
      createDuck({ id: "fourth", stock: 1 }),
    ]);

    const service = new CatalogService(source);

    const result = await service.getAvailableCatalogItems();

    expect(result.items.map((item) => item.id)).toEqual(["third", "second", "fourth"]);
  });

  it("returns explicit empty-state payload when no ducks are available", async () => {
    const source = makeSource([
      createDuck({ id: "sold-out-1", stock: 0 }),
      createDuck({ id: "sold-out-2", stock: -3 }),
    ]);

    const service = new CatalogService(source);

    const result = await service.getAvailableCatalogItems();

    expect(result).toEqual({
      items: [],
      message: EMPTY_CATALOG_MESSAGE,
    });
  });
});
