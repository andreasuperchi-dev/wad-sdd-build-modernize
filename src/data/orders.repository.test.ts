import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import type { OrderRecord } from '../domain/order.js';
import { OrdersRepository } from './orders.repository.js';

describe('OrdersRepository', () => {
  const testDir = path.join(process.cwd(), '.test-orders');
  let testFilePath: string;
  let repository: OrdersRepository;

  beforeEach(async () => {
    testFilePath = path.join(testDir, 'test-orders.json');
    // Clean up before each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, that's fine
    }
    repository = new OrdersRepository(testFilePath);
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, that's fine
    }
  });

  describe('getAllOrders', () => {
    it('returns empty array when file does not exist', async () => {
      const orders = await repository.getAllOrders();
      expect(orders).toEqual([]);
    });

    it('initializes file with empty array when missing', async () => {
      await repository.getAllOrders();
      const content = await fs.readFile(testFilePath, 'utf-8');
      expect(JSON.parse(content)).toEqual([]);
    });

    it('returns orders from existing file', async () => {
      const testOrder: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [
          {
            duckId: 'duck-1',
            name: 'Lucky Duck',
            unitPrice: 25.99,
            quantity: 2,
            lineTotal: 51.98,
          },
        ],
        total: 51.98,
      };

      // Manually write file
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testFilePath, JSON.stringify([testOrder], null, 2), 'utf-8');

      const orders = await repository.getAllOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toEqual(testOrder);
    });

    it('validates order shape before returning', async () => {
      const invalidOrder = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        // Missing required fields
        items: [],
      };

      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testFilePath, JSON.stringify([invalidOrder], null, 2), 'utf-8');

      await expect(repository.getAllOrders()).rejects.toThrow();
    });

    it('throws error if file contains non-array JSON', async () => {
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testFilePath, JSON.stringify({ orders: [] }, null, 2), 'utf-8');

      await expect(repository.getAllOrders()).rejects.toThrow('must contain a JSON array');
    });
  });

  describe('appendOrder', () => {
    it('appends order to empty file', async () => {
      const order: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [],
        total: 0,
      };

      await repository.appendOrder(order);

      const orders = await repository.getAllOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toEqual(order);
    });

    it('appends order to existing orders', async () => {
      const order1: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [],
        total: 0,
      };

      const order2: OrderRecord = {
        orderId: 'ord_124',
        createdAt: '2026-01-02T12:00:00.000Z',
        shippingName: 'Jane Doe',
        email: 'jane@example.com',
        address: '456 Oak Ave',
        items: [
          {
            duckId: 'duck-2',
            name: 'Swift Duck',
            unitPrice: 15.0,
            quantity: 1,
            lineTotal: 15.0,
          },
        ],
        total: 15.0,
      };

      await repository.appendOrder(order1);
      await repository.appendOrder(order2);

      const orders = await repository.getAllOrders();
      expect(orders).toHaveLength(2);
      expect(orders[0]).toEqual(order1);
      expect(orders[1]).toEqual(order2);
    });

    it('rejects invalid order', async () => {
      const invalidOrder = {
        orderId: 'ord_123',
        // Missing required fields
      };

      await expect(repository.appendOrder(invalidOrder as OrderRecord)).rejects.toThrow();
    });

    it('persists orders across repository re-instantiation', async () => {
      const order: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [
          {
            duckId: 'duck-1',
            name: 'Lucky Duck',
            unitPrice: 25.99,
            quantity: 2,
            lineTotal: 51.98,
          },
        ],
        total: 51.98,
      };

      // Append with first repository instance
      await repository.appendOrder(order);

      // Create new repository instance pointing to same file
      const repository2 = new OrdersRepository(testFilePath);
      const orders = await repository2.getAllOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0]).toEqual(order);
    });

    it('handles multiple consecutive appends', async () => {
      const orders: OrderRecord[] = [];
      for (let i = 0; i < 5; i++) {
        orders.push({
          orderId: `ord_${i}`,
          createdAt: `2026-01-0${i + 1}T12:00:00.000Z`,
          shippingName: `Customer ${i}`,
          email: `customer${i}@example.com`,
          address: `${i * 100} Main St`,
          items: [],
          total: i * 10,
        });
      }

      for (const order of orders) {
        await repository.appendOrder(order);
      }

      const persisted = await repository.getAllOrders();
      expect(persisted).toHaveLength(5);
      persisted.forEach((order, index) => {
        expect(order.orderId).toBe(`ord_${index}`);
      });
    });

    it('maintains order of items', async () => {
      const order: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [
          {
            duckId: 'duck-1',
            name: 'Lucky Duck',
            unitPrice: 25.99,
            quantity: 2,
            lineTotal: 51.98,
          },
          {
            duckId: 'duck-2',
            name: 'Swift Duck',
            unitPrice: 15.0,
            quantity: 1,
            lineTotal: 15.0,
          },
          {
            duckId: 'duck-3',
            name: 'Wise Duck',
            unitPrice: 35.5,
            quantity: 3,
            lineTotal: 106.5,
          },
        ],
        total: 173.48,
      };

      await repository.appendOrder(order);
      const retrieved = await repository.getAllOrders();

      expect(retrieved).toHaveLength(1);
      const retrievedOrder = retrieved[0];
      if (!retrievedOrder) throw new Error('Expected order to exist');
      expect(retrievedOrder.items).toHaveLength(3);
      expect(retrievedOrder.items[0]?.duckId).toBe('duck-1');
      expect(retrievedOrder.items[1]?.duckId).toBe('duck-2');
      expect(retrievedOrder.items[2]?.duckId).toBe('duck-3');
    });
  });

  describe('file format', () => {
    it('writes human-readable JSON with indentation', async () => {
      const order: OrderRecord = {
        orderId: 'ord_123',
        createdAt: '2026-01-01T12:00:00.000Z',
        shippingName: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        items: [],
        total: 0,
      };

      await repository.appendOrder(order);

      const content = await fs.readFile(testFilePath, 'utf-8');
      const lines = content.split('\n');

      // Should have indentation (multiple lines)
      expect(lines.length).toBeGreaterThan(3);
      // Should contain opening and closing brackets
      expect(content).toContain('[');
      expect(content).toContain(']');
    });
  });
});
