import type { CatalogItem } from "./duck.js";

export const EMPTY_POND_MESSAGE = "The pond is empty today, come back tomorrow.";

export type FeaturedDuckSuccess = {
  date: string;
  duck: CatalogItem;
};

export type FeaturedDuckFallback = {
  date: string;
  message: string;
};

export type FeaturedDuckResult = FeaturedDuckSuccess | FeaturedDuckFallback;
