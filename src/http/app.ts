import express, { type Express } from "express";

import { createCatalogRouter } from "./routes/catalog.route.js";
import { CatalogService } from "../services/catalog.service.js";

export function createApp(catalogService: CatalogService = new CatalogService()): Express {
  const app = express();

  app.use(express.json());
  app.use(createCatalogRouter(catalogService));

  return app;
}
