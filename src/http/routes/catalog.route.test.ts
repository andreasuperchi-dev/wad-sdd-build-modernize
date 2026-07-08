import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import {
  type DuckSource,
  DUCK_NOT_FOUND_ERROR,
  EMPTY_CATALOG_MESSAGE,
  CatalogService,
} from "../../services/catalog.service.js";
import { type Duck } from "../../domain/duck.js";

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

function createAppWithDucks(ducks: Duck[]) {
  const duckSource: DuckSource = {
    getAllDucks: async () => ducks,
  };

  const service = new CatalogService(duckSource);
  return createApp(service);
}

describe("GET /ducks", () => {
  it("returns 200 and JSON content type", async () => {
    const app = createAppWithDucks([createDuck({ id: "duck-a", stock: 2 })]);

    const response = await request(app).get("/ducks");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("returns only ducks with stock greater than 0", async () => {
    const app = createAppWithDucks([
      createDuck({ id: "available-1", stock: 3 }),
      createDuck({ id: "sold-out", stock: 0 }),
      createDuck({ id: "available-2", stock: 1 }),
    ]);

    const response = await request(app).get("/ducks");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual(["available-1", "available-2"]);
  });

  it("returns required listing fields for each item", async () => {
    const app = createAppWithDucks([
      createDuck({
        id: "shape-1",
        name: "Shape Duck",
        category: "Wellness",
        price: 18.5,
        tagline: "Only listing fields are exposed.",
        description: "Internal detail",
        personalityTraits: ["curious", "calm"],
        stock: 4,
      }),
    ]);

    const response = await request(app).get("/ducks");

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toEqual({
      id: "shape-1",
      name: "Shape Duck",
      category: "Wellness",
      price: 18.5,
      tagline: "Only listing fields are exposed.",
    });
    expect("description" in response.body.items[0]).toBe(false);
    expect("personalityTraits" in response.body.items[0]).toBe(false);
    expect("stock" in response.body.items[0]).toBe(false);
  });

  it("returns explicit empty-state payload when no ducks are available", async () => {
    const app = createAppWithDucks([
      createDuck({ id: "sold-out-1", stock: 0 }),
      createDuck({ id: "sold-out-2", stock: 0 }),
    ]);

    const response = await request(app).get("/ducks");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      message: EMPTY_CATALOG_MESSAGE,
    });
  });
});

describe("GET /ducks/:id", () => {
  it("returns 200 with full detail JSON for a valid ID", async () => {
    const app = createAppWithDucks([
      createDuck({
        id: "detail-200",
        name: "Inspector Duck",
        category: "Debugging",
        price: 22,
        tagline: "Inspects every edge case.",
        description: "A thorough duck with a magnifying monocle.",
        personalityTraits: ["careful", "precise"],
        stock: 5,
      }),
    ]);

    const response = await request(app).get("/ducks/detail-200");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toEqual({
      duck: {
        id: "detail-200",
        name: "Inspector Duck",
        category: "Debugging",
        price: 22,
        tagline: "Inspects every edge case.",
        description: "A thorough duck with a magnifying monocle.",
        personalityTraits: ["careful", "precise"],
        stockStatus: "In stock",
      },
    });
  });

  it("returns 404 with a clear not-found error payload for unknown IDs", async () => {
    const app = createAppWithDucks([createDuck({ id: "known-id", stock: 3 })]);

    const response = await request(app).get("/ducks/unknown-id");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: DUCK_NOT_FOUND_ERROR });
  });

  it("returns deterministic stockStatus values for boundary stock levels", async () => {
    const app = createAppWithDucks([
      createDuck({ id: "sold-out", stock: 0 }),
      createDuck({ id: "low-1", stock: 1 }),
      createDuck({ id: "low-2", stock: 2 }),
      createDuck({ id: "in-stock", stock: 3 }),
    ]);

    const soldOut = await request(app).get("/ducks/sold-out");
    const low1 = await request(app).get("/ducks/low-1");
    const low2 = await request(app).get("/ducks/low-2");
    const inStock = await request(app).get("/ducks/in-stock");

    expect(soldOut.status).toBe(200);
    expect(low1.status).toBe(200);
    expect(low2.status).toBe(200);
    expect(inStock.status).toBe(200);

    expect(soldOut.body.duck.stockStatus).toBe("Sold out");
    expect(low1.body.duck.stockStatus).toBe("Only 1 left");
    expect(low2.body.duck.stockStatus).toBe("Only 2 left");
    expect(inStock.body.duck.stockStatus).toBe("In stock");
  });
});
