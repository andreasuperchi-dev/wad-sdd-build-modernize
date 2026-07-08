export type CartLine = {
  duckId: string;
  quantity: number;
};

export type Cart = {
  items: Map<string, CartLine>;
};

export type CartItemView = {
  duckId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CartView = {
  items: CartItemView[];
  total: number;
};

export type CartError =
  | { status: 400; error: string }
  | { status: 404; error: string }
  | { status: 409; error: string };

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function createEmptyCart(): Cart {
  return { items: new Map<string, CartLine>() };
}
