export type Duck = {
  id: string;
  name: string;
  category: string;
  price: number;
  tagline: string;
  description: string;
  personalityTraits: string[];
  stock: number;
};

export type CatalogItem = Pick<Duck, "id" | "name" | "category" | "price" | "tagline">;

export type StockStatus = "Sold out" | "In stock" | `Only ${number} left`;

export type DuckDetailItem = Pick<
  Duck,
  "id" | "name" | "category" | "price" | "tagline" | "description" | "personalityTraits"
> & {
  stockStatus: StockStatus;
};

export type DuckDetailResult = { duck: DuckDetailItem } | { error: "Duck not found" };

export type EmptyCatalogResult = {
  items: [];
  message: string;
};

export type NonEmptyCatalogResult = {
  items: CatalogItem[];
  message?: undefined;
};

export type CatalogResult = EmptyCatalogResult | NonEmptyCatalogResult;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function isDuck(value: unknown): value is Duck {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.tagline === "string" &&
    typeof value.description === "string" &&
    isStringArray(value.personalityTraits) &&
    typeof value.stock === "number" &&
    Number.isFinite(value.stock)
  );
}

export function isCatalogItem(value: unknown): value is CatalogItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.tagline === "string"
  );
}
