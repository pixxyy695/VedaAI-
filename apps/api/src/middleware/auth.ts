import type { NextFunction, Request, Response } from "express";
import type { User } from "@vedai/shared";
import { extractToken, verifySessionToken } from "../services/authService.js";

export type AuthenticatedRequest = Request & {
  user: User;
};

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const token = extractToken({
      authorization: request.headers.authorization,
      cookie: request.headers.cookie
    });
    const user = await verifySessionToken(token);
    (request as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required.";
    response.status(401).json({ error: message });
  }
}
