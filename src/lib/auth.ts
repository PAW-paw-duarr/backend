import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import { isProd } from "~/utils/constants";
import { httpUnauthorizedError, sendHttpError } from "~/utils/httpError";

const store = new session.MemoryStore();

export const sessionMiddleware = session({
  name: "sess",
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
});

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session?.user) {
    return next();
  }
  sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
  return;
}
