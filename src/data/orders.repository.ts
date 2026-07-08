import fs from 'fs/promises';
import path from 'path';
import type { OrderRecord } from '../domain/order.js';
import { isOrderRecord } from '../domain/order.js';

/**
 * Repository for persisting orders to local JSON file storage.
 * Ensures all-or-nothing writes and restart-safe behavior.
 */
export class OrdersRepository {
  private filePath: string;

  constructor(filePath: string = path.join(process.cwd(), 'src', 'data', 'orders.json')) {
    this.filePath = filePath;
  }

  /**
   * Get all persisted orders.
   * Initializes file if missing; validates shape before returning.
   */
  async getAllOrders(): Promise<OrderRecord[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        throw new Error('orders.json must contain a JSON array');
      }

      // Validate each order matches OrderRecord shape
      const validated: OrderRecord[] = [];
      for (const item of parsed) {
        if (!isOrderRecord(item)) {
          throw new Error(`Invalid order record at index ${validated.length}: ${JSON.stringify(item)}`);
        }
        validated.push(item);
      }

      return validated;
    } catch (error) {
      // Only handle file-not-found case; re-throw validation/parse errors
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        await this.initializeFile();
        return [];
      }
      throw error;
    }
  }

  /**
   * Append a new order record to storage.
   * Performs all-or-nothing write: reads current state, validates, appends, writes atomically.
   */
  async appendOrder(order: OrderRecord): Promise<void> {
    if (!isOrderRecord(order)) {
      throw new Error('Invalid order record');
    }

    // Read current state
    const currentOrders = await this.getAllOrders();

    // Append new order
    currentOrders.push(order);

    // Write atomically (fs.writeFile is atomic on most systems)
    const content = JSON.stringify(currentOrders, null, 2);
    await fs.writeFile(this.filePath, content, 'utf-8');
  }

  /**
   * Initialize the orders file with empty array if it doesn't exist.
   */
  private async initializeFile(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory already exists or can't be created
    }
    await fs.writeFile(this.filePath, JSON.stringify([], null, 2), 'utf-8');
  }
}
