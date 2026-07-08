import { createEmptyCart, type Cart } from "../domain/cart.js";

export class InMemoryCartStore {
  private readonly carts = new Map<string, Cart>();

  getOrCreateCart(sessionId: string): Cart {
    const existing = this.carts.get(sessionId);
    if (existing) {
      return existing;
    }

    const cart = createEmptyCart();
    this.carts.set(sessionId, cart);
    return cart;
  }

  getCart(sessionId: string): Cart | undefined {
    return this.carts.get(sessionId);
  }

  setItem(sessionId: string, duckId: string, quantity: number): void {
    const cart = this.getOrCreateCart(sessionId);
    cart.items.set(duckId, { duckId, quantity });
  }

  removeItem(sessionId: string, duckId: string): void {
    const cart = this.getCart(sessionId);
    if (!cart) {
      return;
    }

    cart.items.delete(duckId);
  }
}
