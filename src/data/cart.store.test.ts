import { describe, expect, it } from "vitest";

import { InMemoryCartStore } from "./cart.store.js";

describe("InMemoryCartStore", () => {
  it("isolates carts by session ID", () => {
    const store = new InMemoryCartStore();

    store.setItem("sid-a", "duck-1", 2);
    store.setItem("sid-b", "duck-1", 1);

    const cartA = store.getOrCreateCart("sid-a");
    const cartB = store.getOrCreateCart("sid-b");

    expect(cartA.items.get("duck-1")?.quantity).toBe(2);
    expect(cartB.items.get("duck-1")?.quantity).toBe(1);
  });

  it("sets and updates item quantities for a session", () => {
    const store = new InMemoryCartStore();

    store.setItem("sid-1", "duck-2", 1);
    store.setItem("sid-1", "duck-2", 4);

    const cart = store.getOrCreateCart("sid-1");
    expect(cart.items.get("duck-2")?.quantity).toBe(4);
  });

  it("removes items without affecting other sessions", () => {
    const store = new InMemoryCartStore();

    store.setItem("sid-a", "duck-3", 3);
    store.setItem("sid-b", "duck-3", 2);

    store.removeItem("sid-a", "duck-3");

    const cartA = store.getOrCreateCart("sid-a");
    const cartB = store.getOrCreateCart("sid-b");

    expect(cartA.items.has("duck-3")).toBe(false);
    expect(cartB.items.get("duck-3")?.quantity).toBe(2);
  });
});
