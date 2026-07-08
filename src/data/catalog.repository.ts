import { readFile } from "node:fs/promises";
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
}
