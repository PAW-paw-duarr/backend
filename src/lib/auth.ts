import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import { UserModel } from "~/models/users.js";
import env from "~/utils/env.js";
import {
  httpInternalServerError,
  httpUnauthorizedError,
  sendHttpError,
} from "~/utils/httpError.js";
import type { components } from "./api/schema.js";

const store = new session.MemoryStore();
export const sessionMiddleware = session({
  name: "sess",
  secret: env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    domain: env.URL.hostname,
    secure: env.IS_PROD,
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

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    const user = await UserModel.findById("68b9b730d2e4b72d4511948f");
    if (!user) {
      sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
      return;
    }
    res.locals.user = user;
    return next();
  }
  sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
  return;
}

export async function authAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    const user = await UserModel.findById(req.session.userId);
    if (!user) {
      sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
      return;
    }
    res.locals.user = user;
    return next();
  }
  sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
  return;
}

type createUserSessionParams = {
  req: Request;
  res: Response;
  user: components["schemas"]["data-user"];
  redirectTo?: string;
};
export function createUserSession({ req, res, user, redirectTo }: createUserSessionParams) {
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
      if (redirectTo) {
        res.redirect(redirectTo);
        return;
      }
      res.json(user);
      return;
    });
  });
}

type destroyUserSessionParams = {
  req: Request;
  res: Response;
};
export function destroyUserSession({ req, res }: destroyUserSessionParams) {
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
