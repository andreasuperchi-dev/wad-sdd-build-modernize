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

  describe("decrementStockAtomic", () => {
    it("decrements stock for a single duck", async () => {
      const dir = await makeTempDir();
      const ducks = [
        {
          id: "duck-1",
          name: "Lucky Duck",
          category: "Debugging",
          price: 25.99,
          tagline: "Brings good luck",
          description: "A lucky duck",
          personalityTraits: ["lucky"],
          stock: 10,
        },
      ];
      const filePath = join(dir, "catalog.json");
      await writeFile(filePath, JSON.stringify(ducks, null, 2), "utf-8");

      const repository = new CatalogRepository(filePath);
      const result = await repository.decrementStockAtomic([{ duckId: "duck-1", quantity: 3 }]);

      expect(result).toBe(true);
      const updated = await repository.getAllDucks();
      expect(updated[0]?.stock).toBe(7);
    });

    it("decrements stock for multiple ducks atomically", async () => {
      const dir = await makeTempDir();
      const ducks = [
        {
          id: "duck-1",
          name: "Lucky Duck",
          category: "Debugging",
          price: 25.99,
          tagline: "Brings good luck",
          description: "A lucky duck",
          personalityTraits: ["lucky"],
          stock: 10,
        },
        {
          id: "duck-2",
          name: "Swift Duck",
          category: "Performance",
          price: 15.0,
          tagline: "Fast as lightning",
          description: "A swift duck",
          personalityTraits: ["fast"],
          stock: 5,
        },
      ];
      const filePath = join(dir, "catalog.json");
      await writeFile(filePath, JSON.stringify(ducks, null, 2), "utf-8");

      const repository = new CatalogRepository(filePath);
      const result = await repository.decrementStockAtomic([
        { duckId: "duck-1", quantity: 2 },
        { duckId: "duck-2", quantity: 1 },
      ]);

      expect(result).toBe(true);
      const updated = await repository.getAllDucks();
      expect(updated[0]?.stock).toBe(8);
      expect(updated[1]?.stock).toBe(4);
    });

    it("returns false on conflict (insufficient stock) without modifying stock", async () => {
      const dir = await makeTempDir();
      const ducks = [
        {
          id: "duck-1",
          name: "Lucky Duck",
          category: "Debugging",
          price: 25.99,
          tagline: "Brings good luck",
          description: "A lucky duck",
          personalityTraits: ["lucky"],
          stock: 3,
        },
      ];
      const filePath = join(dir, "catalog.json");
      await writeFile(filePath, JSON.stringify(ducks, null, 2), "utf-8");

      const repository = new CatalogRepository(filePath);
      const result = await repository.decrementStockAtomic([{ duckId: "duck-1", quantity: 5 }]);

      expect(result).toBe(false);
      const unmodified = await repository.getAllDucks();
      expect(unmodified[0]?.stock).toBe(3);
    });

    it("returns false if any line in multi-line decrement conflicts", async () => {
      const dir = await makeTempDir();
      const ducks = [
        {
          id: "duck-1",
          name: "Lucky Duck",
          category: "Debugging",
          price: 25.99,
          tagline: "Brings good luck",
          description: "A lucky duck",
          personalityTraits: ["lucky"],
          stock: 10,
        },
        {
          id: "duck-2",
          name: "Swift Duck",
          category: "Performance",
          price: 15.0,
          tagline: "Fast as lightning",
          description: "A swift duck",
          personalityTraits: ["fast"],
          stock: 2,
        },
      ];
      const filePath = join(dir, "catalog.json");
      await writeFile(filePath, JSON.stringify(ducks, null, 2), "utf-8");

      const repository = new CatalogRepository(filePath);
      // Second decrement exceeds available stock for duck-2
      const result = await repository.decrementStockAtomic([
        { duckId: "duck-1", quantity: 3 },
        { duckId: "duck-2", quantity: 5 },
      ]);

      expect(result).toBe(false);
      // Neither should be modified
      const unmodified = await repository.getAllDucks();
      expect(unmodified[0]?.stock).toBe(10);
      expect(unmodified[1]?.stock).toBe(2);
    });

    it("throws error for non-existent duck", async () => {
      const dir = await makeTempDir();
      const ducks = [
        {
          id: "duck-1",
          name: "Lucky Duck",
          category: "Debugging",
          price: 25.99,
          tagline: "Brings good luck",
          description: "A lucky duck",
          personalityTraits: ["lucky"],
          stock: 10,
        },
      ];
      const filePath = join(dir, "catalog.json");
      await writeFile(filePath, JSON.stringify(ducks, null, 2), "utf-8");

      const repository = new CatalogRepository(filePath);

      await expect(
        repository.decrementStockAtomic([{ duckId: "non-existent", quantity: 1 }])
      ).rejects.toMatchObject({
        name: "CatalogRepositoryError",
        code: "INVALID_DATA",
      });
    });

    it("throws error for non-positive quantity", async () => {
      const dir = await makeTempDir();
      const ducks = [
        {
          id: "duck-1",
          name: "Lucky Duck",
          category: "Debugging",
          price: 25.99,
          tagline: "Brings good luck",
          description: "A lucky duck",
          personalityTraits: ["lucky"],
          stock: 10,
        },
      ];
      const filePath = join(dir, "catalog.json");
      await writeFile(filePath, JSON.stringify(ducks, null, 2), "utf-8");

      const repository = new CatalogRepository(filePath);

      await expect(
        repository.decrementStockAtomic([{ duckId: "duck-1", quantity: 0 }])
      ).rejects.toMatchObject({
        name: "CatalogRepositoryError",
        code: "INVALID_DATA",
      });
    });
  });});