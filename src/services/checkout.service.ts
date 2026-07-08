import type { OrdersRepository } from "../data/orders.repository.js";
import { CatalogRepository } from "../data/catalog.repository.js";
import { InMemoryCartStore } from "../data/cart.store.js";
import {
  type CheckoutRequest,
  type CheckoutResult,
  type OrderRecord,
  validateCheckoutRequest,
  generateOrderId,
  getCurrentTimestamp,
} from "../domain/order.js";
import type { CartStore } from "./cart.service.js";
import { CatalogService } from "./catalog.service.js";

export type CheckoutDeps = {
  cartStore: CartStore;
  catalogRepository: CatalogRepository;
  catalogService: CatalogService;
  ordersRepository: OrdersRepository;
};

/**
 * Checkout service orchestrates the complete checkout workflow:
 * 1. Validate payload (strong email/field validation)
 * 2. Load cart by session
 * 3. Validate cart is non-empty
 * 4. Re-validate stock for all cart lines
 * 5. Atomically:
 *    - Decrement stock
 *    - Persist order
 *    - Clear cart
 * 6. Return confirmation or error
 */
export class CheckoutService {
  constructor(private readonly deps: CheckoutDeps) {}

  /**
   * Execute checkout for a session with given payload.
   * Returns CheckoutResult union: success (201), validation error (400), or stock conflict (409).
   */
  async checkout(sessionId: string, payload: unknown): Promise<CheckoutResult> {
    // Step 1: Validate payload
    const validation = validateCheckoutRequest(payload);
    if (!validation.valid) {
      return {
        status: 400,
        data: {
          error: "Validation failed",
          fieldErrors: validation.errors,
        },
      };
    }

    const request = payload as CheckoutRequest;

    // Step 2: Load cart
    const cart = this.deps.cartStore.getCart(sessionId);

    // Step 3: Validate cart is non-empty
    if (!cart || cart.items.size === 0) {
      return {
        status: 400,
        data: {
          error: "Cart is empty",
        },
      };
    }

    // Step 4: Re-validate stock for all lines
    const allDucks = await this.deps.catalogRepository.getAllDucks();
    const ducksById = new Map(allDucks.map((d) => [d.id, d]));

    const stockConflict = this.checkStockAvailability(cart, ducksById);
    if (stockConflict) {
      return {
        status: 409,
        data: {
          error: stockConflict,
        },
      };
    }

    // Step 5: Atomic orchestration
    // 5a. Build decrements array for catalog
    const decrements = Array.from(cart.items.values()).map((line) => ({
      duckId: line.duckId,
      quantity: line.quantity,
    }));

    // 5b. Atomically decrement stock
    const stockDecrementSuccess = await this.deps.catalogRepository.decrementStockAtomic(decrements);
    if (!stockDecrementSuccess) {
      // This should not happen since we already validated, but be safe
      return {
        status: 409,
        data: {
          error: "Stock conflict detected during processing",
        },
      };
    }

    // 5c. Build order record from cart
    const orderId = generateOrderId();
    const createdAt = getCurrentTimestamp();

    const orderItems = Array.from(cart.items.values())
      .map((line) => {
        const duck = ducksById.get(line.duckId);
        if (!duck) return null;

        const lineTotal = duck.price * line.quantity;
        return {
          duckId: duck.id,
          name: duck.name,
          unitPrice: duck.price,
          quantity: line.quantity,
          lineTotal,
        };
      })
      .filter((item) => item !== null);

    const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const order: OrderRecord = {
      orderId,
      createdAt,
      shippingName: request.shippingName.trim(),
      email: request.email.trim(),
      address: request.address.trim(),
      items: orderItems,
      total,
    };

    // 5d. Persist order
    await this.deps.ordersRepository.appendOrder(order);

    // 5e. Clear cart
    // Clear all line items from the session cart
    for (const duckId of cart.items.keys()) {
      this.deps.cartStore.removeItem(sessionId, duckId);
    }

    // Step 6: Return confirmation
    return {
      status: 201,
      data: {
        orderId,
        createdAt,
        items: orderItems,
        total,
      },
    };
  }

  /**
   * Check if all cart lines have sufficient stock.
   * Returns error message if conflict, undefined if all OK.
   */
  private checkStockAvailability(
    cart: { items: Map<string, { duckId: string; quantity: number }> },
    ducksById: Map<string, any>
  ): string | undefined {
    for (const line of cart.items.values()) {
      const duck = ducksById.get(line.duckId);
      if (!duck) {
        return `Duck ${line.duckId} not found`;
      }
      if (duck.stock < line.quantity) {
        return `Insufficient stock for ${duck.name}`;
      }
    }
    return undefined;
  }
}
