import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import { isProd } from "~/utils/constants";
import env from "~/utils/env";
import { httpInternalServerError, httpUnauthorizedError, sendHttpError } from "~/utils/httpError";
import type { components } from "./api/schema";

const store = new session.MemoryStore();
export const sessionMiddleware = session({
  name: "sess",
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    domain: env.URL.hostname,
    secure: isProd,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
});

export const oauth2Client = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${env.URL.baseUrl}/api/auth/google/callback`,
});

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
  return;
}

export function createUserSession(
  req: Request,
  res: Response,
  user: components["schemas"]["data-user"],
) {
  req.session.regenerate((err) => {
    if (err) {
      sendHttpError({ res, error: httpInternalServerError });
      return;
    }
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        sendHttpError({ res, error: httpInternalServerError });
        return;
      }
      res.json(user);
      return;
    });
  });
}

export function destroyUserSession(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      sendHttpError({ res, error: httpInternalServerError });
      return;
    }
    res.clearCookie("sess");
    res.json({ message: "Signed out successfully" });
    return;
  });
}
