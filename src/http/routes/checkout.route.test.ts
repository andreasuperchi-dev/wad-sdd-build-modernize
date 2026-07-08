import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import fs from "fs/promises";
import path from "path";
import express from "express";
import type { Duck } from "../../domain/duck.js";
import { CatalogRepository } from "../../data/catalog.repository.js";
import { OrdersRepository } from "../../data/orders.repository.js";
import { CatalogService } from "../../services/catalog.service.js";
import { CartService } from "../../services/cart.service.js";
import { CheckoutService } from "../../services/checkout.service.js";
import { InMemoryCartStore } from "../../data/cart.store.js";
import { createCatalogRouter } from "./catalog.route.js";
import { createCartRouter } from "./cart.route.js";
import { createCheckoutRouter } from "./checkout.route.js";

describe("POST /checkout route", () => {
  const testDir = path.join(process.cwd(), ".test-checkout-route");
  let app: ReturnType<typeof express>;
  let catalogFilePath: string;
  let ordersFilePath: string;

  const testDucks: Duck[] = [
    {
      id: "duck-1",
      name: "Lucky Duck",
      category: "Debugging",
      price: 25.99,
      tagline: "Brings good luck",
      description: "A lucky duck",
      personalityTraits: ["lucky"],
      stock: 10,
    },
    {
      id: "duck-2",
      name: "Swift Duck",
      category: "Performance",
      price: 15.0,
      tagline: "Fast as lightning",
      description: "A swift duck",
      personalityTraits: ["fast"],
      stock: 5,
    },
  ];

  beforeEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist
    }

    await fs.mkdir(testDir, { recursive: true });
    catalogFilePath = path.join(testDir, "catalog.json");
    ordersFilePath = path.join(testDir, "orders.json");

    // Initialize catalog with test ducks
    await fs.writeFile(catalogFilePath, JSON.stringify(testDucks, null, 2), "utf-8");

    // Create services with test paths
    const catalogRepository = new CatalogRepository(catalogFilePath);
    const ordersRepository = new OrdersRepository(ordersFilePath);
    const cartStore = new InMemoryCartStore();
    const catalogService = new CatalogService(catalogRepository);
    const cartService = new CartService(cartStore, catalogRepository);

    const checkoutService = new CheckoutService({
      cartStore,
      catalogRepository,
      catalogService,
      ordersRepository,
    });

    // Build custom app with test services
    app = express();
    app.use(express.json());
    app.use(createCatalogRouter(catalogService));
    app.use(createCartRouter(cartService));
    app.use(createCheckoutRouter(checkoutService));
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist
    }
  });

  describe("validation errors (400)", () => {
    it("returns 400 with validation errors for invalid email", async () => {
      // First add item to cart
      const cartRes = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-1", quantity: 1 });
      expect(cartRes.status).toBe(200);

      const setCookie = cartRes.get("Set-Cookie");
      if (!setCookie) throw new Error("Expected Set-Cookie header");
      const sidMatch = setCookie[0]?.match(/sid=([^;]+)/);
      const sid = sidMatch?.[1];
      if (!sid) throw new Error("Expected sid cookie");

      // Try checkout with invalid email
      const checkoutRes = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid}`)
        .send({
          shippingName: "John Doe",
          email: "invalid-email",
          address: "123 Main St",
          cardNumber: "4111111111111111",
        });

      expect(checkoutRes.status).toBe(400);
      expect(checkoutRes.body.fieldErrors?.email).toBeDefined();
    });

    it("returns 400 with validation errors for short shipping name", async () => {
      const cartRes = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-1", quantity: 1 });
      const setCookie = cartRes.get("Set-Cookie");
      if (!setCookie) throw new Error("Expected Set-Cookie header");
      const sidMatch = setCookie[0]?.match(/sid=([^;]+)/);
      const sid = sidMatch?.[1];
      if (!sid) throw new Error("Expected sid cookie");

      const checkoutRes = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid}`)
        .send({
          shippingName: "J",
          email: "john@example.com",
          address: "123 Main St",
          cardNumber: "4111111111111111",
        });

      expect(checkoutRes.status).toBe(400);
      expect(checkoutRes.body.fieldErrors?.shippingName).toBeDefined();
    });

    it("returns 400 for empty cart", async () => {
      // Don't add anything to cart
      const checkoutRes = await request(app)
        .post("/checkout")
        .send({
          shippingName: "John Doe",
          email: "john@example.com",
          address: "123 Main St",
          cardNumber: "4111111111111111",
        });

      expect(checkoutRes.status).toBe(400);
      expect(checkoutRes.body.error).toContain("empty");
    });
  });

  describe("successful checkout (201)", () => {
    it("returns 201 with order confirmation for valid checkout", async () => {
      // Add item to cart
      const cartRes = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-1", quantity: 2 });
      expect(cartRes.status).toBe(200);

      const setCookie = cartRes.get("Set-Cookie");
      if (!setCookie) throw new Error("Expected Set-Cookie header");
      const sidMatch = setCookie[0]?.match(/sid=([^;]+)/);
      const sid = sidMatch?.[1];
      if (!sid) throw new Error("Expected sid cookie");

      // Perform checkout
      const checkoutRes = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid}`)
        .send({
          shippingName: "John Doe",
          email: "john@example.com",
          address: "123 Main St",
          cardNumber: "4111111111111111",
        });

      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.orderId).toBeDefined();
      expect(checkoutRes.body.orderId).toMatch(/^ord_/);
      expect(checkoutRes.body.items).toHaveLength(1);
      expect(checkoutRes.body.items[0]).toMatchObject({
        duckId: "duck-1",
        name: "Lucky Duck",
        unitPrice: 25.99,
        quantity: 2,
        lineTotal: 51.98,
      });
      expect(checkoutRes.body.total).toBe(51.98);
      expect(checkoutRes.body.createdAt).toBeDefined();
    });

    it("returns 201 for multi-item checkout", async () => {
      // Add multiple items
      const cartRes1 = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-1", quantity: 2 });
      expect(cartRes1.status).toBe(200);

      const setCookie = cartRes1.get("Set-Cookie");
      if (!setCookie) throw new Error("Expected Set-Cookie header");
      const sidMatch = setCookie[0]?.match(/sid=([^;]+)/);
      const sid = sidMatch?.[1];
      if (!sid) throw new Error("Expected sid cookie");

      const cartRes2 = await request(app)
        .post("/cart/items")
        .set("Cookie", `sid=${sid}`)
        .send({ duckId: "duck-2", quantity: 1 });
      expect(cartRes2.status).toBe(200);

      // Perform checkout
      const checkoutRes = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid}`)
        .send({
          shippingName: "Jane Doe",
          email: "jane@example.com",
          address: "456 Oak Ave",
          cardNumber: "5555555555555555",
        });

      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.items).toHaveLength(2);
      const total = 25.99 * 2 + 15.0 * 1;
      expect(checkoutRes.body.total).toBeCloseTo(total, 2);
    });

    it("maintains session isolation across different customers", async () => {
      // Customer 1 adds item
      const cart1Res = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-1", quantity: 1 });
      const setCookie1 = cart1Res.get("Set-Cookie");
      if (!setCookie1) throw new Error("Expected Set-Cookie header");
      const sidMatch1 = setCookie1[0]?.match(/sid=([^;]+)/);
      const sid1 = sidMatch1?.[1];
      if (!sid1) throw new Error("Expected sid cookie");

      // Customer 2 adds different item
      const cart2Res = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-2", quantity: 2 });
      const setCookie2 = cart2Res.get("Set-Cookie");
      if (!setCookie2) throw new Error("Expected Set-Cookie header");
      const sidMatch2 = setCookie2[0]?.match(/sid=([^;]+)/);
      const sid2 = sidMatch2?.[1];
      if (!sid2) throw new Error("Expected sid cookie");

      // Customer 1 checks out
      const checkout1Res = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid1}`)
        .send({
          shippingName: "John Doe",
          email: "john@example.com",
          address: "123 Main St",
          cardNumber: "4111111111111111",
        });

      expect(checkout1Res.status).toBe(201);
      expect(checkout1Res.body.items).toHaveLength(1);
      expect(checkout1Res.body.items[0]?.duckId).toBe("duck-1");

      // Customer 2 checks out
      const checkout2Res = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid2}`)
        .send({
          shippingName: "Jane Doe",
          email: "jane@example.com",
          address: "456 Oak Ave",
          cardNumber: "5555555555555555",
        });

      expect(checkout2Res.status).toBe(201);
      expect(checkout2Res.body.items).toHaveLength(1);
      expect(checkout2Res.body.items[0]?.duckId).toBe("duck-2");
    });

    it("clears cart after successful checkout", async () => {
      // Add item
      const cartRes = await request(app)
        .post("/cart/items")
        .send({ duckId: "duck-1", quantity: 1 });

      const setCookie = cartRes.get("Set-Cookie");
      if (!setCookie) throw new Error("Expected Set-Cookie header");
      const sidMatch = setCookie[0]?.match(/sid=([^;]+)/);
      const sid = sidMatch?.[1];
      if (!sid) throw new Error("Expected sid cookie");

      // Verify cart has item
      const getCartBefore = await request(app)
        .get("/cart")
        .set("Cookie", `sid=${sid}`);
      expect(getCartBefore.status).toBe(200);
      expect(getCartBefore.body.items).toHaveLength(1);

      // Checkout
      const checkoutRes = await request(app)
        .post("/checkout")
        .set("Cookie", `sid=${sid}`)
        .send({
          shippingName: "John Doe",
          email: "john@example.com",
          address: "123 Main St",
          cardNumber: "4111111111111111",
        });
      expect(checkoutRes.status).toBe(201);

      // Verify cart is now empty
      const getCartAfter = await request(app)
        .get("/cart")
        .set("Cookie", `sid=${sid}`);
      expect(getCartAfter.status).toBe(200);
      expect(getCartAfter.body.items).toHaveLength(0);
      expect(getCartAfter.body.total).toBe(0);
    });
  });
});
