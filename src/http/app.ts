import express, { type Express } from "express";
import { fileURLToPath } from "node:url";

import { createCatalogRouter } from "./routes/catalog.route.js";
import { createCartRouter } from "./routes/cart.route.js";
import { createCheckoutRouter } from "./routes/checkout.route.js";
import { createAdminRouter } from "./routes/admin.route.js";
import { createFeaturedRouter } from "./routes/featured.route.js";
import { createQuizRouter } from "./routes/quiz.route.js";
import { CatalogService } from "../services/catalog.service.js";
import { CartService } from "../services/cart.service.js";
import { CheckoutService } from "../services/checkout.service.js";
import { CatalogRepository } from "../data/catalog.repository.js";
import { OrdersRepository } from "../data/orders.repository.js";
import { InMemoryCartStore } from "../data/cart.store.js";
import { CuratorService } from "../services/curator.service.js";
import { FeaturedService } from "../services/featured.service.js";
import { QuizService } from "../services/quiz.service.js";

export function createApp(
  catalogService?: CatalogService,
  cartService?: CartService,
): Express {
  const app = express();

  // Shared dependencies
  const catalogRepository = new CatalogRepository();
  const ordersRepository = new OrdersRepository();
  const cartStore = new InMemoryCartStore();

  const resolvedCatalogService = catalogService ?? new CatalogService(catalogRepository);
  const resolvedCartService = cartService ?? new CartService(cartStore, catalogRepository);

  const checkoutService = new CheckoutService({
    cartStore,
    catalogRepository,
    catalogService: resolvedCatalogService,
    ordersRepository,
  });

  const curatorService = new CuratorService(catalogRepository);
  const featuredService = new FeaturedService(catalogRepository);
  const quizService = new QuizService(catalogRepository);

  const publicDirPath = fileURLToPath(new URL("../public", import.meta.url));

  app.use(express.json());
  app.use(express.static(publicDirPath));

  app.use(createFeaturedRouter(featuredService));
  app.use(createCatalogRouter(resolvedCatalogService));
  app.use(createCartRouter(resolvedCartService));
  app.use(createCheckoutRouter(checkoutService));
  app.use(createAdminRouter(curatorService));
  app.use(createQuizRouter(quizService));

  return app;
}
