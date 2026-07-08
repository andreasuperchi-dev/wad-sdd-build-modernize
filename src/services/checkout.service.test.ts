import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { CatalogRepository } from "../data/catalog.repository.js";
import { InMemoryCartStore } from "../data/cart.store.js";
import { OrdersRepository } from "../data/orders.repository.js";
import { CatalogService } from "./catalog.service.js";
import { CheckoutService } from "./checkout.service.js";
import type { Duck } from "../domain/duck.js";

describe("CheckoutService", () => {
  const testDir = path.join(process.cwd(), ".test-checkout");
  let catalogFilePath: string;
  let ordersFilePath: string;
  let catalogRepository: CatalogRepository;
  let ordersRepository: OrdersRepository;
  let cartStore: InMemoryCartStore;
  let catalogService: CatalogService;
  let checkoutService: CheckoutService;

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

    catalogRepository = new CatalogRepository(catalogFilePath);
    ordersRepository = new OrdersRepository(ordersFilePath);
    cartStore = new InMemoryCartStore();
    catalogService = new CatalogService(catalogRepository);

    checkoutService = new CheckoutService({
      cartStore,
      catalogRepository,
      catalogService,
      ordersRepository,
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist
    }
  });

  describe("validation errors (400)", () => {
    it("returns validation error for invalid email", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "not-an-email",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(result.data.fieldErrors?.email).toBeDefined();
      }
    });

    it("returns validation error for short shipping name", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "J",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(result.data.fieldErrors?.shippingName).toBeDefined();
      }
    });

    it("returns validation error for short address", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(result.data.fieldErrors?.address).toBeDefined();
      }
    });

    it("returns validation error for empty card number", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "   ",
      });

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(result.data.fieldErrors?.cardNumber).toBeDefined();
      }
    });

    it("returns validation error for missing required fields", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const result = await checkoutService.checkout(sessionId, {});

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(Object.keys(result.data.fieldErrors || {}).length).toBeGreaterThan(0);
      }
    });

    it("returns validation error for empty cart", async () => {
      const sessionId = "session-1";

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(result.data.error).toContain("empty");
      }
    });

    it("returns validation error for non-existent cart session", async () => {
      const sessionId = "nonexistent-session";

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(400);
      if (result.status === 400) {
        expect(result.data.error).toContain("empty");
      }
    });
  });

  describe("stock conflict (409)", () => {
    it("returns 409 when cart line exceeds available stock", async () => {
      const sessionId = "session-1";
      // Add more items than available stock
      cartStore.setItem(sessionId, "duck-1", 15); // Stock is 10

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(409);
      if (result.status === 409) {
        expect(result.data.error).toContain("stock");
      }
    });

    it("returns 409 for stock conflict in multi-item cart", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 5);
      cartStore.setItem(sessionId, "duck-2", 10); // Stock for duck-2 is 5

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(409);
    });

    it("does not modify stock or persist order on stock conflict", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 15); // Exceeds stock

      await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      // Verify stock unchanged
      const ducks = await catalogRepository.getAllDucks();
      expect(ducks[0]?.stock).toBe(10);

      // Verify no order persisted
      const orders = await ordersRepository.getAllOrders();
      expect(orders).toHaveLength(0);
    });
  });

  describe("successful checkout (201)", () => {
    it("processes valid single-item checkout", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 2);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(201);
      if (result.status === 201) {
        expect(result.data.orderId).toBeDefined();
        expect(result.data.orderId).toMatch(/^ord_/);
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0]).toMatchObject({
          duckId: "duck-1",
          name: "Lucky Duck",
          unitPrice: 25.99,
          quantity: 2,
          lineTotal: 51.98,
        });
        expect(result.data.total).toBe(51.98);
      }
    });

    it("processes valid multi-item checkout", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 2);
      cartStore.setItem(sessionId, "duck-2", 1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "Jane Doe",
        email: "jane@example.com",
        address: "456 Oak Avenue",
        cardNumber: "5555555555555555",
      });

      expect(result.status).toBe(201);
      if (result.status === 201) {
        expect(result.data.items).toHaveLength(2);
        const total = 25.99 * 2 + 15.0 * 1;
        expect(result.data.total).toBe(total);
      }
    });

    it("decrements stock atomically on successful checkout", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 3);
      cartStore.setItem(sessionId, "duck-2", 2);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(201);

      const ducks = await catalogRepository.getAllDucks();
      expect(ducks[0]?.stock).toBe(7); // 10 - 3
      expect(ducks[1]?.stock).toBe(3); // 5 - 2
    });

    it("persists order record on successful checkout", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 2);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(201);

      if (result.status === 201) {
        const orders = await ordersRepository.getAllOrders();
        expect(orders).toHaveLength(1);

        const order = orders[0];
        if (!order) throw new Error("Order should exist");
        expect(order.orderId).toBe(result.data.orderId);
        expect(order.shippingName).toBe("John Doe");
        expect(order.email).toBe("john@example.com");
        expect(order.address).toBe("123 Main St");
        expect(order.items).toHaveLength(1);
        expect(order.total).toBe(51.98);
      }
    });

    it("clears cart on successful checkout", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 2);

      const beforeCart = cartStore.getCart(sessionId);
      expect(beforeCart?.items.size).toBe(1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(201);

      const afterCart = cartStore.getCart(sessionId);
      expect(afterCart?.items.size).toBe(0);
    });

    it("generates unique order IDs for consecutive checkouts", async () => {
      const session1 = "session-1";
      const session2 = "session-2";

      // First order
      cartStore.setItem(session1, "duck-1", 1);
      const result1 = await checkoutService.checkout(session1, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      // Replenish stock for second order
      await fs.writeFile(catalogFilePath, JSON.stringify(testDucks, null, 2), "utf-8");

      // Second order
      cartStore.setItem(session2, "duck-2", 1);
      const result2 = await checkoutService.checkout(session2, {
        shippingName: "Jane Doe",
        email: "jane@example.com",
        address: "456 Oak Ave",
        cardNumber: "5555555555555555",
      });

      expect(result1.status).toBe(201);
      expect(result2.status).toBe(201);

      if (result1.status === 201 && result2.status === 201) {
        expect(result1.data.orderId).not.toBe(result2.data.orderId);
      }
    });

    it("trims whitespace from shipping fields in persisted order", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "  John Doe  ",
        email: "  john@example.com  ",
        address: "  123 Main St  ",
        cardNumber: "4111111111111111",
      });

      expect(result.status).toBe(201);

      const orders = await ordersRepository.getAllOrders();
      const order = orders[0];
      if (!order) throw new Error("Order should exist");

      expect(order.shippingName).toBe("John Doe");
      expect(order.email).toBe("john@example.com");
      expect(order.address).toBe("123 Main St");
    });

    it("does not persist card number in order record", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      const orders = await ordersRepository.getAllOrders();
      const order = orders[0];
      if (!order) throw new Error("Order should exist");

      // Verify card number is not in the order
      const orderJson = JSON.stringify(order);
      expect(orderJson).not.toContain("4111111111111111");
      expect(orderJson).not.toContain("cardNumber");
    });

    it("includes createdAt timestamp in order record", async () => {
      const sessionId = "session-1";
      cartStore.setItem(sessionId, "duck-1", 1);

      const beforeCheckout = new Date();

      const result = await checkoutService.checkout(sessionId, {
        shippingName: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        cardNumber: "4111111111111111",
      });

      const afterCheckout = new Date();

      expect(result.status).toBe(201);

      const orders = await ordersRepository.getAllOrders();
      const order = orders[0];
      if (!order) throw new Error("Order should exist");

      const orderTime = new Date(order.createdAt);
      expect(orderTime.getTime()).toBeGreaterThanOrEqual(beforeCheckout.getTime());
      expect(orderTime.getTime()).toBeLessThanOrEqual(afterCheckout.getTime());
    });
  });
});
