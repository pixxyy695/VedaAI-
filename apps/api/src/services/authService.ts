import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import type { User } from "@vedai/shared";
import { config, isProduction } from "../config.js";
import { createUser, findUserByEmail, findUserById } from "../db/repository.js";

const SESSION_COOKIE = "vedai_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  email: string;
  nonce: string;
};

export class AuthError extends Error {
  status = 401;
}

export function publicUser(user: { id: string; name: string; email: string; createdAt: string }): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    const error = new AuthError("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash
  });

  return createSession(publicUser(user));
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AuthError("Invalid email or password.");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthError("Invalid email or password.");
  }

  return createSession(publicUser(user));
}

export function createSession(user: User) {
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      nonce: crypto.randomBytes(8).toString("hex")
    } satisfies SessionPayload,
    config.jwtSecret,
    { expiresIn: SESSION_MAX_AGE_SECONDS }
  );

  return { user, token };
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: isProduction ? "none" : "lax",
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    path: "/"
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
  });
}

function tokenFromCookie(cookieHeader?: string) {
  if (!cookieHeader) return "";
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  return match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : "";
}

export function extractBearerToken(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) return "";
  return authHeader.slice("Bearer ".length);
}

export function extractToken(input: { authorization?: string; cookie?: string; queryToken?: string }) {
  return input.queryToken || extractBearerToken(input.authorization) || tokenFromCookie(input.cookie);
}

export async function verifySessionToken(token: string) {
  if (!token) {
    throw new AuthError("Authentication required.");
  }

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as SessionPayload;
  } catch {
    throw new AuthError("Session expired. Please sign in again.");
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new AuthError("Session user no longer exists.");
  }

  return publicUser(user);
}
