import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { isDuck, type Duck } from "../domain/duck.js";

export class CatalogRepositoryError extends Error {
  code: "FILE_NOT_FOUND" | "INVALID_JSON" | "INVALID_DATA";

  constructor(
    code: "FILE_NOT_FOUND" | "INVALID_JSON" | "INVALID_DATA",
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "CatalogRepositoryError";
    this.code = code;
  }
}

const defaultCatalogFilePath = fileURLToPath(new URL("./ducks.seed.json", import.meta.url));

export class CatalogRepository {
  constructor(private readonly catalogFilePath: string = defaultCatalogFilePath) {}

  async getAllDucks(): Promise<Duck[]> {
    let raw: string;

    try {
      raw = await readFile(this.catalogFilePath, "utf-8");
    } catch (error) {
      throw new CatalogRepositoryError("FILE_NOT_FOUND", "Catalog storage file not found.", { cause: error });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new CatalogRepositoryError("INVALID_JSON", "Catalog storage file contains invalid JSON.", { cause: error });
    }

    if (!Array.isArray(parsed) || !parsed.every((item) => isDuck(item))) {
      throw new CatalogRepositoryError("INVALID_DATA", "Catalog storage file contains invalid duck records.");
    }

    return parsed;
  }

  async findByNameNormalized(name: string): Promise<Duck | undefined> {
    const ducks = await this.getAllDucks();
    const normalized = normalizeName(name);
    return ducks.find((duck) => normalizeName(duck.name) === normalized);
  }

  async addDuck(duck: Duck): Promise<void> {
    const allDucks = await this.getAllDucks();
    const duplicate = allDucks.some((candidate) => normalizeName(candidate.name) === normalizeName(duck.name));

    if (duplicate) {
      throw new CatalogRepositoryError("INVALID_DATA", "Catalog already contains a duck with the same name.");
    }

    allDucks.push(duck);
    await this.writeAllDucks(allDucks);
  }

  /**
   * Atomically decrement stock for multiple ducks.
   * Validates that all requested decrements are possible before writing.
   * Returns true on success, false if any line conflicts (insufficient stock).
   * On conflict, no stock is modified.
   *
   * @param decrements - Array of { duckId, quantity } to decrement
   * @returns true if all decrements applied, false if any conflict
   */
  async decrementStockAtomic(
    decrements: Array<{ duckId: string; quantity: number }>
  ): Promise<boolean> {
    // Validate quantities are positive
    for (const decrement of decrements) {
      if (decrement.quantity <= 0) {
        throw new CatalogRepositoryError(
          "INVALID_DATA",
          `Invalid decrement quantity: ${decrement.quantity} (must be positive)`
        );
      }
    }

    // Read current state
    const allDucks = await this.getAllDucks();

    // Build a map for quick lookup
    const duckMap = new Map<string, Duck>(allDucks.map((d) => [d.id, d]));

    // Validate all decrements are possible (all-or-nothing check)
    for (const decrement of decrements) {
      const duck = duckMap.get(decrement.duckId);
      if (!duck) {
        throw new CatalogRepositoryError("INVALID_DATA", `Duck not found: ${decrement.duckId}`);
      }
      if (duck.stock < decrement.quantity) {
        // Conflict: insufficient stock
        return false;
      }
    }

    // Apply all decrements
    for (const decrement of decrements) {
      const duck = duckMap.get(decrement.duckId);
      if (duck) {
        duck.stock -= decrement.quantity;
      }
    }

    // Write updated ducks back to file
    const updatedDucks = Array.from(duckMap.values());
    await this.writeAllDucks(updatedDucks);

    return true;
  }

  private async writeAllDucks(ducks: Duck[]): Promise<void> {
    const content = JSON.stringify(ducks, null, 2);
    await writeFile(this.catalogFilePath, content, "utf-8");
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}
