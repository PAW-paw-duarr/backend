import argon2 from "argon2";
import type { components } from "~/lib/api/schema.js";
import { oauth2Client } from "~/lib/auth.js";
import { logger } from "~/lib/logger.js";
import { type createUserPasswordParams, UserModel } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import env from "~/utils/env.js";
import {
  httpBadRequestError,
  httpInternalServerError,
  httpUnauthorizedError,
} from "~/utils/httpError.js";

type serviceSigninPasswordParams = {
  email: string;
  password: string;
};
export async function serviceSigninPassword(
  params: serviceSigninPasswordParams,
): retService<components["schemas"]["data-user"]> {
  const data = await UserModel.findOne({ email: params.email });
  if (!data || data.password === undefined) {
    logger.info({ email: params.email }, `User/ password not found`);
    return { error: httpBadRequestError, data: "Invalid email or password" };
  }

  // verify password
  const isValid = data.password ? await argon2.verify(data.password, params.password) : false;
  if (!isValid) {
    logger.info({ email: params.email }, `Invalid password`);
    return { error: httpUnauthorizedError, data: "Invalid email or password" };
  }

  const user: components["schemas"]["data-user"] = {
    id: data.id,
    name: data.name,
    email: data.email,
    cv_url: data.cv_url,
    team_id: data.team?._id.toString(),
    google_id: data.google_id,
  };
  return { success: 200, data: user };
}

export async function serviceSignupPassword(
  params: createUserPasswordParams,
): retService<components["schemas"]["data-user"]> {
  params.password = await argon2.hash(params.password);

  const data = await UserModel.createUserPassword(params);
  if (data instanceof Error) {
    return { error: httpBadRequestError, data: data.message };
  }
  logger.info({ email: params.email }, `User password created`);

  const user: components["schemas"]["data-user"] = {
    id: data.id,
    name: data.name,
    email: data.email.toLowerCase(),
  };
  return { success: 201, data: user };
}

export async function serviceFindOrCreateGoogleUser(
  code: string,
): retService<components["schemas"]["data-user"]> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token || "",
    audience: env.GOOGLE_CLIENT_ID,
  });

  const userInfo = ticket.getPayload();
  if (!userInfo || !userInfo.email || !userInfo.name || !userInfo.sub) {
    logger.error("Failed to retrieve user info from Google ID token");
    return { error: httpInternalServerError };
  }

  const data = await UserModel.createOrFindUsergoogle({
    name: userInfo.name,
    email: userInfo.email,
    google_id: userInfo.sub,
  });

  const user: components["schemas"]["data-user"] = {
    id: data.id,
    name: data.name,
    email: data.email,
    cv_url: data.cv_url,
    team_id: data.team?._id.toString(),
    google_id: data.google_id,
  };

  return { success: 200, data: user };
}
