import express, { type Express } from "express";

import { createCatalogRouter } from "./routes/catalog.route.js";
import { createCartRouter } from "./routes/cart.route.js";
import { CatalogService } from "../services/catalog.service.js";
import { CartService } from "../services/cart.service.js";

export function createApp(
  catalogService: CatalogService = new CatalogService(),
  cartService: CartService = new CartService(),
): Express {
  const app = express();

  app.use(express.json());
  app.use(createCatalogRouter(catalogService));
  app.use(createCartRouter(cartService));

  return app;
}
