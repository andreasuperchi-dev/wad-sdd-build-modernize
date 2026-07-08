import express, { type Express } from "express";

import { createCatalogRouter } from "./routes/catalog.route.js";
import { createCartRouter } from "./routes/cart.route.js";
import { createCheckoutRouter } from "./routes/checkout.route.js";
import { CatalogService } from "../services/catalog.service.js";
import { CartService } from "../services/cart.service.js";
import { CheckoutService } from "../services/checkout.service.js";
import { CatalogRepository } from "../data/catalog.repository.js";
import { OrdersRepository } from "../data/orders.repository.js";
import { InMemoryCartStore } from "../data/cart.store.js";

export function createApp(
  catalogService: CatalogService = new CatalogService(),
  cartService: CartService = new CartService(),
): Express {
  const app = express();

  // Create checkout service with shared dependencies
  const catalogRepository = new CatalogRepository();
  const ordersRepository = new OrdersRepository();
  const cartStore = new InMemoryCartStore();
  const checkoutService = new CheckoutService({
    cartStore,
    catalogRepository,
    catalogService,
    ordersRepository,
  });

  app.use(express.json());
  app.use(createCatalogRouter(catalogService));
  app.use(createCartRouter(cartService));
  app.use(createCheckoutRouter(checkoutService));

  return app;
}
