import { randomUUID } from "node:crypto";

import { CatalogRepository } from "../data/catalog.repository.js";
import type { Duck } from "../domain/duck.js";
import { logCuratorAddDuck } from "./audit.logger.js";

export type CuratorAddDuckInput = {
  name: unknown;
  category: unknown;
  price: unknown;
  tagline: unknown;
  description: unknown;
  personalityTraits: unknown;
  initialStock: unknown;
};

export type CuratorAddDuckError = { status: 400 | 409; error: string };

export class CuratorService {
  constructor(private readonly catalogRepository: CatalogRepository = new CatalogRepository()) {}

  async addDuck(payload: unknown): Promise<{ duck: Duck } | CuratorAddDuckError> {
    const validated = validateInput(payload);
    if ("status" in validated) {
      return validated;
    }

    const existingByName = await this.catalogRepository.findByNameNormalized(validated.name);
    if (existingByName) {
      return { status: 409, error: "Duck name already exists" };
    }

    const duck: Duck = {
      id: createDuckId(validated.name),
      name: validated.name,
      category: validated.category,
      price: validated.price,
      tagline: validated.tagline,
      description: validated.description,
      personalityTraits: validated.personalityTraits,
      stock: validated.initialStock,
    };

    await this.catalogRepository.addDuck(duck);
    logCuratorAddDuck(duck.name);

    return { duck };
  }
}

function validateInput(payload: unknown):
  | {
      name: string;
      category: string;
      price: number;
      tagline: string;
      description: string;
      personalityTraits: string[];
      initialStock: number;
    }
  | CuratorAddDuckError {
  if (typeof payload !== "object" || payload === null) {
    return { status: 400, error: "Invalid payload" };
  }

  const input = payload as CuratorAddDuckInput;

  const name = asRequiredString(input.name, "name");
  if (typeof name !== "string") return name;

  const category = asRequiredString(input.category, "category");
  if (typeof category !== "string") return category;

  const tagline = asRequiredString(input.tagline, "tagline");
  if (typeof tagline !== "string") return tagline;

  const description = asRequiredString(input.description, "description");
  if (typeof description !== "string") return description;

  if (typeof input.price !== "number" || !Number.isFinite(input.price) || input.price < 0) {
    return { status: 400, error: "price must be a non-negative number" };
  }

  if (typeof input.initialStock !== "number" || !Number.isInteger(input.initialStock) || input.initialStock < 0) {
    return { status: 400, error: "initialStock must be a non-negative integer" };
  }

  if (
    !Array.isArray(input.personalityTraits) ||
    input.personalityTraits.length === 0 ||
    !input.personalityTraits.every((trait) => typeof trait === "string" && trait.trim().length > 0)
  ) {
    return { status: 400, error: "personalityTraits must be a non-empty string array" };
  }

  return {
    name,
    category,
    price: input.price,
    tagline,
    description,
    personalityTraits: input.personalityTraits.map((trait) => trait.trim()),
    initialStock: input.initialStock,
  };
}

function asRequiredString(value: unknown, fieldName: string): string | CuratorAddDuckError {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { status: 400, error: `${fieldName} is required` };
  }
  return value.trim();
}

function createDuckId(name: string): string {
  const slug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return slug ? `duck-${slug}-${randomUUID().slice(0, 8)}` : `duck-${randomUUID().slice(0, 8)}`;
}

export { createDuckId };
