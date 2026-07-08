import { Router } from "express";

import { CatalogService } from "../../services/catalog.service.js";

export function createCatalogRouter(catalogService: CatalogService = new CatalogService()): Router {
  const router = Router();

  router.get("/ducks", async (_request, response, next) => {
    try {
      const result = await catalogService.getAvailableCatalogItems();
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
