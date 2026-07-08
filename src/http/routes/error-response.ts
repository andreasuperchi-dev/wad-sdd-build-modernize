import type { Response } from "express";

export type StatusError = {
  status: 400 | 401 | 404 | 409;
  error: string;
};

export function sendStatusError(response: Response, statusError: StatusError): void {
  response.status(statusError.status).json({ error: statusError.error });
}
