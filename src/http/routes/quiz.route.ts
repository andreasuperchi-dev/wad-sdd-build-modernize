import { Router } from "express";

import { QuizService } from "../../services/quiz.service.js";
import { sendStatusError } from "./error-response.js";

export function createQuizRouter(quizService: QuizService = new QuizService()): Router {
  const router = Router();

  router.post("/quiz/result", async (request, response, next) => {
    try {
      const result = await quizService.getResult(request.body);
      if ("status" in result) {
        sendStatusError(response, result);
        return;
      }

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
