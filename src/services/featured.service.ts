import { CatalogRepository } from "../data/catalog.repository.js";
import type { CatalogItem, Duck } from "../domain/duck.js";
import { EMPTY_POND_MESSAGE, type FeaturedDuckResult } from "../domain/featured.js";

export type FeaturedDuckSource = {
  getAllDucks(): Promise<Duck[]>;
};

export class FeaturedService {
  constructor(private readonly duckSource: FeaturedDuckSource = new CatalogRepository()) {}

  async getDuckOfTheDay(date: Date = new Date()): Promise<FeaturedDuckResult> {
    const dateString = toDateString(date);
    const inStock = (await this.duckSource.getAllDucks())
      .filter((duck) => duck.stock > 0)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (inStock.length === 0) {
      return { date: dateString, message: EMPTY_POND_MESSAGE };
    }

    const seed = dateSeed(dateString);
    const index = seed % inStock.length;
    const selected = inStock[index];

    return {
      date: dateString,
      duck: toCatalogItem(selected as Duck),
    };
  }
}

function toCatalogItem(duck: Duck): CatalogItem {
  return {
    id: duck.id,
    name: duck.name,
    category: duck.category,
    price: duck.price,
    tagline: duck.tagline,
  };
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateSeed(dateString: string): number {
  return Number(dateString.replaceAll("-", ""));
}
