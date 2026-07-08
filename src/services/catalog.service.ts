import { CatalogRepository } from "../data/catalog.repository.js";
import { type CatalogItem, type CatalogResult, type Duck } from "../domain/duck.js";

export type DuckSource = {
  getAllDucks(): Promise<Duck[]>;
};

const EMPTY_CATALOG_MESSAGE = "No ducks are currently available. Please check back soon.";

export class CatalogService {
  constructor(private readonly duckSource: DuckSource = new CatalogRepository()) {}

  async getAvailableCatalogItems(): Promise<CatalogResult> {
    const ducks = await this.duckSource.getAllDucks();

    const items: CatalogItem[] = ducks
      .filter((duck) => duck.stock > 0)
      .map(({ id, name, category, price, tagline }) => ({
        id,
        name,
        category,
        price,
        tagline,
      }));

    if (items.length === 0) {
      return {
        items: [],
        message: EMPTY_CATALOG_MESSAGE,
      };
    }

    return { items };
  }
}

export { EMPTY_CATALOG_MESSAGE };
