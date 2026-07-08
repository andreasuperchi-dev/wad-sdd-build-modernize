import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { CatalogRepository } from "../data/catalog.repository.js";
import { CuratorService } from "./curator.service.js";

const tempDirs: string[] = [];

async function createService() {
  const dir = await mkdtemp(join(tmpdir(), "curator-service-"));
  tempDirs.push(dir);

  const catalogPath = join(dir, "catalog.json");
  await writeFile(catalogPath, "[]", "utf-8");

  const repository = new CatalogRepository(catalogPath);
  return { service: new CuratorService(repository), repository };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("CuratorService", () => {
  it("creates duck for valid payload", async () => {
    const { service, repository } = await createService();

    const result = await service.addDuck({
      name: "Curated Duck",
      category: "Adventurer",
      price: 12,
      tagline: "tagline",
      description: "description",
      personalityTraits: ["bold"],
      initialStock: 3,
    });

    expect("duck" in result).toBe(true);

    const ducks = await repository.getAllDucks();
    expect(ducks).toHaveLength(1);
    expect(ducks[0]?.name).toBe("Curated Duck");
  });

  it("rejects duplicate duck names", async () => {
    const { service } = await createService();

    await service.addDuck({
      name: "Duplicate Duck",
      category: "Adventurer",
      price: 12,
      tagline: "tagline",
      description: "description",
      personalityTraits: ["bold"],
      initialStock: 3,
    });

    const second = await service.addDuck({
      name: " duplicate duck ",
      category: "Comedian",
      price: 14,
      tagline: "tagline",
      description: "description",
      personalityTraits: ["funny"],
      initialStock: 1,
    });

    expect(second).toEqual({ status: 409, error: "Duck name already exists" });
  });

  it("rejects invalid payload fields", async () => {
    const { service } = await createService();

    const result = await service.addDuck({
      name: "",
      category: "Adventurer",
      price: -1,
      tagline: "",
      description: "",
      personalityTraits: [],
      initialStock: -1,
    });

    expect("status" in result && result.status === 400).toBe(true);
  });
});
