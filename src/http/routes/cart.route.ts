import { Router } from "express";

import { CartService } from "../../services/cart.service.js";
import { getOrCreateSessionId } from "../session/session.js";

const INVALID_DUCK_ID_ERROR = "duckId is required";

export function createCartRouter(cartService: CartService = new CartService()): Router {
  const router = Router();

  router.get("/cart", async (request, response, next) => {
    try {
      const sessionId = getOrCreateSessionId(request, response);
      const cart = await cartService.getCart(sessionId);
      response.status(200).json(cart);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cart/items", async (request, response, next) => {
    try {
      const sessionId = getOrCreateSessionId(request, response);
      const duckId = request.body?.duckId;
      const quantity = request.body?.quantity;

      if (typeof duckId !== "string" || duckId.length === 0) {
        response.status(400).json({ error: INVALID_DUCK_ID_ERROR });
        return;
      }

      const result = await cartService.addItem(sessionId, duckId, quantity);

      if ("status" in result) {
        response.status(result.status).json({ error: result.error });
        return;
      }

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/cart/items/:duckId", async (request, response, next) => {
    try {
      const sessionId = getOrCreateSessionId(request, response);
      const result = await cartService.updateItem(sessionId, request.params.duckId, request.body?.quantity);

      if ("status" in result) {
        response.status(result.status).json({ error: result.error });
        return;
      }

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/cart/items/:duckId", async (request, response, next) => {
    try {
      const sessionId = getOrCreateSessionId(request, response);
      const result = await cartService.removeItem(sessionId, request.params.duckId);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export { INVALID_DUCK_ID_ERROR };
