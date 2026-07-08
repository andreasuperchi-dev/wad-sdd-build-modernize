import { CatalogRepository } from "../data/catalog.repository.js";
import { type CatalogItem, type CatalogResult, type Duck, type DuckDetailResult, type StockStatus } from "../domain/duck.js";

export type DuckSource = {
  getAllDucks(): Promise<Duck[]>;
};

const EMPTY_CATALOG_MESSAGE = "No ducks are currently available. Please check back soon.";
const DUCK_NOT_FOUND_ERROR = "Duck not found";

export class CatalogService {
  constructor(private readonly duckSource: DuckSource = new CatalogRepository()) {}

  async getDuckDetailById(id: string): Promise<DuckDetailResult> {
    const ducks = await this.duckSource.getAllDucks();
    const duck = ducks.find((candidate) => candidate.id === id);

    if (!duck) {
      return { error: DUCK_NOT_FOUND_ERROR };
    }

    return {
      duck: {
        id: duck.id,
        name: duck.name,
        category: duck.category,
        price: duck.price,
        tagline: duck.tagline,
        description: duck.description,
        personalityTraits: duck.personalityTraits,
        stockStatus: toStockStatus(duck.stock),
      },
    };
  }

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

function toStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return "Sold out";
  }

  if (stock <= 2) {
    return `Only ${stock} left`;
  }

  return "In stock";
}

export { EMPTY_CATALOG_MESSAGE, DUCK_NOT_FOUND_ERROR, toStockStatus };
