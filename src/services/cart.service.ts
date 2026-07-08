import { CatalogRepository } from "../data/catalog.repository.js";
import { InMemoryCartStore } from "../data/cart.store.js";
import { type CartError, type CartItemView, type CartView, isPositiveInteger } from "../domain/cart.js";
import { type Duck } from "../domain/duck.js";

export type CartDuckSource = {
  getAllDucks(): Promise<Duck[]>;
};

export type CartStore = {
  getOrCreateCart(sessionId: string): { items: Map<string, { duckId: string; quantity: number }> };
  getCart(sessionId: string): { items: Map<string, { duckId: string; quantity: number }> } | undefined;
  setItem(sessionId: string, duckId: string, quantity: number): void;
  removeItem(sessionId: string, duckId: string): void;
};

const INVALID_QUANTITY_ERROR = "Quantity must be a positive integer";
const DUCK_NOT_FOUND_ERROR = "Duck not found";
const STOCK_EXCEEDED_ERROR = "Requested quantity exceeds available stock";

export class CartService {
  constructor(
    private readonly cartStore: CartStore = new InMemoryCartStore(),
    private readonly duckSource: CartDuckSource = new CatalogRepository(),
  ) {}

  async getCart(sessionId: string): Promise<CartView> {
    const cart = this.cartStore.getCart(sessionId);
    if (!cart) {
      return { items: [], total: 0 };
    }

    const ducksById = await this.getDuckLookup();
    return this.toCartView(cart.items, ducksById);
  }

  async addItem(sessionId: string, duckId: string, quantity: number = 1): Promise<CartView | CartError> {
    if (!isPositiveInteger(quantity)) {
      return { status: 400, error: INVALID_QUANTITY_ERROR };
    }

    const ducksById = await this.getDuckLookup();
    const duck = ducksById.get(duckId);
    if (!duck) {
      return { status: 404, error: DUCK_NOT_FOUND_ERROR };
    }

    const cart = this.cartStore.getOrCreateCart(sessionId);
    const existing = cart.items.get(duckId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (nextQuantity > duck.stock) {
      return { status: 409, error: STOCK_EXCEEDED_ERROR };
    }

    this.cartStore.setItem(sessionId, duckId, nextQuantity);
    const updatedCart = this.cartStore.getOrCreateCart(sessionId);
    return this.toCartView(updatedCart.items, ducksById);
  }

  async updateItem(sessionId: string, duckId: string, quantity: number): Promise<CartView | CartError> {
    if (!isPositiveInteger(quantity)) {
      return { status: 400, error: INVALID_QUANTITY_ERROR };
    }

    const ducksById = await this.getDuckLookup();
    const duck = ducksById.get(duckId);
    if (!duck) {
      return { status: 404, error: DUCK_NOT_FOUND_ERROR };
    }

    if (quantity > duck.stock) {
      return { status: 409, error: STOCK_EXCEEDED_ERROR };
    }

    this.cartStore.setItem(sessionId, duckId, quantity);
    const updatedCart = this.cartStore.getOrCreateCart(sessionId);
    return this.toCartView(updatedCart.items, ducksById);
  }

  async removeItem(sessionId: string, duckId: string): Promise<CartView> {
    this.cartStore.removeItem(sessionId, duckId);

    const cart = this.cartStore.getCart(sessionId);
    if (!cart) {
      return { items: [], total: 0 };
    }

    const ducksById = await this.getDuckLookup();
    return this.toCartView(cart.items, ducksById);
  }

  private async getDuckLookup(): Promise<Map<string, Duck>> {
    const ducks = await this.duckSource.getAllDucks();
    return new Map(ducks.map((duck) => [duck.id, duck]));
  }

  private toCartView(
    itemMap: Map<string, { duckId: string; quantity: number }>,
    ducksById: Map<string, Duck>,
  ): CartView {
    const items: CartItemView[] = [];

    for (const line of itemMap.values()) {
      const duck = ducksById.get(line.duckId);
      if (!duck) {
        continue;
      }

      const lineTotal = duck.price * line.quantity;
      items.push({
        duckId: line.duckId,
        name: duck.name,
        unitPrice: duck.price,
        quantity: line.quantity,
        lineTotal,
      });
    }

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, total };
  }
}

export { DUCK_NOT_FOUND_ERROR, INVALID_QUANTITY_ERROR, STOCK_EXCEEDED_ERROR };
