import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { InMemoryCartStore } from "../../data/cart.store.js";
import { type Duck } from "../../domain/duck.js";
import {
  CartService,
  DUCK_NOT_FOUND_ERROR,
  INVALID_QUANTITY_ERROR,
  STOCK_EXCEEDED_ERROR,
  type CartDuckSource,
} from "../../services/cart.service.js";

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

function createAppWithCartService(ducks: Duck[]) {
  const cartService = new CartService(new InMemoryCartStore(), makeSource(ducks));
  return createApp(undefined, cartService);
}

describe("cart routes", () => {
  it("GET /cart returns empty cart and total 0 for a new session", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a" })]);

    const response = await request(app).get("/cart");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], total: 0 });
  });

  it("POST /cart/items adds item with default quantity", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a", price: 12 })]);

    const response = await request(app).post("/cart/items").send({ duckId: "duck-a" });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      { duckId: "duck-a", name: "Default Duck", unitPrice: 12, quantity: 1, lineTotal: 12 },
    ]);
    expect(response.body.total).toBe(12);
  });

  it("PATCH /cart/items/:duckId updates quantity", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a", price: 4, stock: 10 })]);
    const agent = request.agent(app);

    await agent.post("/cart/items").send({ duckId: "duck-a", quantity: 1 });
    const response = await agent.patch("/cart/items/duck-a").send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toEqual({
      duckId: "duck-a",
      name: "Default Duck",
      unitPrice: 4,
      quantity: 3,
      lineTotal: 12,
    });
    expect(response.body.total).toBe(12);
  });

  it("DELETE /cart/items/:duckId removes item", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a", price: 8, stock: 10 })]);
    const agent = request.agent(app);

    await agent.post("/cart/items").send({ duckId: "duck-a", quantity: 2 });
    const response = await agent.delete("/cart/items/duck-a");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], total: 0 });
  });

  it("maps invalid quantity to 400", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a", stock: 3 })]);

    const response = await request(app).post("/cart/items").send({ duckId: "duck-a", quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: INVALID_QUANTITY_ERROR });
  });

  it("maps unknown duck to 404", async () => {
    const app = createAppWithCartService([createDuck({ id: "known-id" })]);

    const response = await request(app).post("/cart/items").send({ duckId: "missing-id", quantity: 1 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: DUCK_NOT_FOUND_ERROR });
  });

  it("maps stock exceeded to 409", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a", stock: 2 })]);

    const response = await request(app).post("/cart/items").send({ duckId: "duck-a", quantity: 3 });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: STOCK_EXCEEDED_ERROR });
  });

  it("preserves cart state across multiple requests for the same session", async () => {
    const app = createAppWithCartService([
      createDuck({ id: "duck-a", price: 5, stock: 10 }),
      createDuck({ id: "duck-b", price: 3, stock: 10 }),
    ]);
    const agent = request.agent(app);

    await agent.post("/cart/items").send({ duckId: "duck-a", quantity: 2 });
    await agent.post("/cart/items").send({ duckId: "duck-b", quantity: 1 });

    const response = await agent.get("/cart");

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      { duckId: "duck-a", name: "Default Duck", unitPrice: 5, quantity: 2, lineTotal: 10 },
      { duckId: "duck-b", name: "Default Duck", unitPrice: 3, quantity: 1, lineTotal: 3 },
    ]);
    expect(response.body.total).toBe(13);
  });

  it("keeps carts isolated between different client sessions", async () => {
    const app = createAppWithCartService([createDuck({ id: "duck-a", price: 6, stock: 10 })]);
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    await agentA.post("/cart/items").send({ duckId: "duck-a", quantity: 2 });

    const responseA = await agentA.get("/cart");
    const responseB = await agentB.get("/cart");

    expect(responseA.status).toBe(200);
    expect(responseA.body.items).toHaveLength(1);
    expect(responseA.body.total).toBe(12);

    expect(responseB.status).toBe(200);
    expect(responseB.body).toEqual({ items: [], total: 0 });
  });
});
