import { Router } from "express";

import { hasValidAdminPassword } from "../config/admin.config.js";
import { CuratorService } from "../../services/curator.service.js";
import { sendStatusError } from "./error-response.js";

const UNAUTHORIZED_ERROR = "Unauthorized";

export function createAdminRouter(curatorService: CuratorService = new CuratorService()): Router {
  const router = Router();

  router.post("/admin/ducks", async (request, response, next) => {
    try {
      const providedPassword = request.header("x-admin-password");
      if (!hasValidAdminPassword(providedPassword)) {
        sendStatusError(response, { status: 401, error: UNAUTHORIZED_ERROR });
        return;
      }

      const result = await curatorService.addDuck(request.body);
      if ("status" in result) {
        sendStatusError(response, result);
        return;
      }

      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export { UNAUTHORIZED_ERROR };
