import { Router } from "express";
import { loginRequestSchema, registerRequestSchema } from "@vedai/shared";
import { clearSessionCookie, loginUser, registerUser, setSessionCookie, verifySessionToken, extractToken } from "../services/authService.js";

export const authRouter = Router();

authRouter.post("/auth/register", async (request, response, next) => {
  try {
    const parsed = registerRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(422).json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors });
      return;
    }

    const session = await registerUser(parsed.data);
    setSessionCookie(response, session.token);
    response.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/login", async (request, response, next) => {
  try {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(422).json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors });
      return;
    }

    const session = await loginUser(parsed.data);
    setSessionCookie(response, session.token);
    response.json(session);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/logout", (_request, response) => {
  clearSessionCookie(response);
  response.status(204).send();
});

authRouter.get("/auth/me", async (request, response, next) => {
  try {
    const token = extractToken({
      authorization: request.headers.authorization,
      cookie: request.headers.cookie
    });
    const user = await verifySessionToken(token);
    response.json({ user });
  } catch (error) {
    next(error);
  }
});
