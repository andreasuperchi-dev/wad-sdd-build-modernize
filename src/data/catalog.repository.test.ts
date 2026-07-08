import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { CatalogRepository, CatalogRepositoryError } from "./catalog.repository.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "duck-emporium-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("CatalogRepository", () => {
  it("reads duck records from the seed file", async () => {
    const repository = new CatalogRepository();

    const ducks = await repository.getAllDucks();

    expect(ducks.length).toBeGreaterThanOrEqual(10);
    expect(ducks[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      category: expect.any(String),
      price: expect.any(Number),
      tagline: expect.any(String),
      description: expect.any(String),
      personalityTraits: expect.any(Array),
      stock: expect.any(Number),
    });
  });

  it("throws FILE_NOT_FOUND when the storage file does not exist", async () => {
    const repository = new CatalogRepository("/path/that/does/not/exist.json");

    await expect(repository.getAllDucks()).rejects.toMatchObject({
      name: "CatalogRepositoryError",
      code: "FILE_NOT_FOUND",
    });
  });

  it("throws INVALID_JSON when the storage file is malformed", async () => {
    const dir = await makeTempDir();
    const filePath = join(dir, "catalog.json");
    await writeFile(filePath, "{ invalid json", "utf-8");

    const repository = new CatalogRepository(filePath);

    await expect(repository.getAllDucks()).rejects.toMatchObject({
      name: "CatalogRepositoryError",
      code: "INVALID_JSON",
    });
  });
});
