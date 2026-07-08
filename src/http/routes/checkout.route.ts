import { Router } from "express";

import { CheckoutService } from "../../services/checkout.service.js";
import { CatalogRepository } from "../../data/catalog.repository.js";
import { OrdersRepository } from "../../data/orders.repository.js";
import { CatalogService } from "../../services/catalog.service.js";
import { InMemoryCartStore } from "../../data/cart.store.js";
import { getOrCreateSessionId } from "../session/session.js";

export function createCheckoutRouter(
  checkoutService: CheckoutService = new CheckoutService({
    cartStore: new InMemoryCartStore(),
    catalogRepository: new CatalogRepository(),
    catalogService: new CatalogService(),
    ordersRepository: new OrdersRepository(),
  })
): Router {
  const router = Router();

  router.post("/checkout", async (request, response, next) => {
    try {
      const sessionId = getOrCreateSessionId(request, response);
      const payload = request.body;

      const result = await checkoutService.checkout(sessionId, payload);

      if (result.status === 201) {
        response.status(201).json(result.data);
        return;
      }

      if (result.status === 400) {
        response.status(400).json(result.data);
        return;
      }

      if (result.status === 409) {
        response.status(409).json(result.data);
        return;
      }

      // Exhaustive check (TypeScript)
      const _exhaustive: never = result;
      next(_exhaustive);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
