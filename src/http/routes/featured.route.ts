import { Router } from "express";

import { FeaturedService } from "../../services/featured.service.js";

export function createFeaturedRouter(featuredService: FeaturedService = new FeaturedService()): Router {
  const router = Router();

  router.get("/ducks/featured", async (_request, response, next) => {
    try {
      const result = await featuredService.getDuckOfTheDay();
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
