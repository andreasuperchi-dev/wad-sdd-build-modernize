import { describe, expect, it } from "vitest";

import { DUCK_NOT_FOUND_ERROR, EMPTY_CATALOG_MESSAGE, CatalogService, type DuckSource } from "./catalog.service.js";
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

  it("returns full detail payload for a valid duck ID", async () => {
    const source = makeSource([
      createDuck({
        id: "detail-1",
        name: "Inspector Duck",
        category: "Debugging",
        price: 23,
        tagline: "Shows every clue.",
        description: "A meticulous duck for deep investigation.",
        personalityTraits: ["meticulous", "curious"],
        stock: 5,
      }),
    ]);

    const service = new CatalogService(source);
    const result = await service.getDuckDetailById("detail-1");

    expect(result).toEqual({
      duck: {
        id: "detail-1",
        name: "Inspector Duck",
        category: "Debugging",
        price: 23,
        tagline: "Shows every clue.",
        description: "A meticulous duck for deep investigation.",
        personalityTraits: ["meticulous", "curious"],
        stockStatus: "In stock",
      },
    });
  });

  it("maps stock status deterministically for 0, 1, 2, and 3+", async () => {
    const source = makeSource([
      createDuck({ id: "sold-out", stock: 0 }),
      createDuck({ id: "low-1", stock: 1 }),
      createDuck({ id: "low-2", stock: 2 }),
      createDuck({ id: "in-stock", stock: 3 }),
    ]);

    const service = new CatalogService(source);

    const soldOut = await service.getDuckDetailById("sold-out");
    const low1 = await service.getDuckDetailById("low-1");
    const low2 = await service.getDuckDetailById("low-2");
    const inStock = await service.getDuckDetailById("in-stock");

    if (!("duck" in soldOut) || !("duck" in low1) || !("duck" in low2) || !("duck" in inStock)) {
      throw new Error("Expected detail result for all known IDs");
    }

    expect(soldOut.duck.stockStatus).toBe("Sold out");
    expect(low1.duck.stockStatus).toBe("Only 1 left");
    expect(low2.duck.stockStatus).toBe("Only 2 left");
    expect(inStock.duck.stockStatus).toBe("In stock");
  });

  it("returns not-found result for unknown IDs", async () => {
    const source = makeSource([createDuck({ id: "known-id", stock: 2 })]);
    const service = new CatalogService(source);

    const result = await service.getDuckDetailById("missing-id");

    expect(result).toEqual({ error: DUCK_NOT_FOUND_ERROR });
  });

  it("supports detail lookup using an ID sourced from catalog results", async () => {
    const source = makeSource([
      createDuck({ id: "catalog-id-1", stock: 4, name: "Catalog Anchor" }),
      createDuck({ id: "catalog-id-2", stock: 1, name: "Follow-up Duck" }),
    ]);

    const service = new CatalogService(source);
    const catalog = await service.getAvailableCatalogItems();
    const detail = await service.getDuckDetailById(catalog.items[0]?.id ?? "");

    if (!("duck" in detail)) {
      throw new Error("Expected detail result for catalog ID");
    }

    expect(detail.duck.id).toBe("catalog-id-1");
    expect(detail.duck.name).toBe("Catalog Anchor");
  });
});
