import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { type DuckSource, EMPTY_CATALOG_MESSAGE, CatalogService } from "../../services/catalog.service.js";
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
