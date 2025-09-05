import argon2 from "argon2";
import type { components } from "~/lib/api/schema";
import { oauth2Client } from "~/lib/auth";
import { logger } from "~/lib/logger";
import { type createUserPasswordParams, UserModel } from "~/models/users";
import { httpBadRequestError, httpInternalServerError } from "~/utils/httpError";
import type { retService } from "./helper";

type serviceSigninPasswordParams = {
  email: string;
  password: string;
};
export async function serviceSigninPassword(
  params: serviceSigninPasswordParams,
): retService<components["schemas"]["data-user"]> {
  const data = await UserModel.findByEmail(params.email);
  if (!data || data.password === undefined) {
    logger.info(`User/ password not found: ${params.email}`);
    return { error: httpBadRequestError, data: "Invalid email or password" };
  }

  const isValid = data.password ? await argon2.verify(data.password, params.password) : false;
  if (!isValid) {
    logger.info(`Invalid password for: ${params.email}`);
    return { error: httpBadRequestError, data: "Invalid email or password" };
  }

  const user: components["schemas"]["data-user"] = {
    id: data._id.toString(),
    name: data.name,
    email: data.email,
    cv_url: data.cv_url,
    team_id: data.team_id ? data.team_id.toString() : undefined,
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

  const user: components["schemas"]["data-user"] = {
    id: data.id,
    name: data.name,
    email: data.email,
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
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const userInfo = ticket.getPayload();
  if (!userInfo) {
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
    team_id: data.team_id ? data.team_id.toString() : undefined,
    google_id: data.google_id,
  };

  return { success: 200, data: user };
}
