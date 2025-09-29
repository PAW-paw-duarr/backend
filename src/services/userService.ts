import argon2 from "argon2";
import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
import { deleteS3Keys, extractS3KeyFromUrl } from "~/lib/s3.js";
import { type UserClass, UserModel } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import { httpBadRequestError, httpNotFoundError } from "~/utils/httpError.js";

export async function serviceGetUserById(
  id: string,
): retService<components["schemas"]["data-user"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid user ID" };
  }

  const data = await UserModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "User not found" };
  }

  const user: components["schemas"]["data-user"] = {
    id: data.id,
    email: data.email,
    name: data.name,
    cv_url: data.cv_url,
    google_id: data.google_id,
    team_id: data.team ? data.team._id.toString() : undefined,
  };

  return { success: 200, data: user };
}

type serviceUpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  cv_url?: string;
};
export async function serviceUpdateUser(
  currentUser: UserClass,
  payload: serviceUpdateUserPayload,
): retService<components["schemas"]["data-user"]> {
  if (currentUser.google_id) {
    delete payload.email;
    delete payload.password;
  }

  if (payload.password) {
    payload.password = await argon2.hash(payload.password);
  }

  const data = await UserModel.findByIdAndUpdate(currentUser.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!data) {
    return { error: httpNotFoundError, data: "User not found" };
  }

  const user: components["schemas"]["data-user"] = {
    id: data.id,
    email: data.email,
    name: data.name,
    cv_url: data.cv_url,
    google_id: data.google_id,
    team_id: data.team ? data.team._id.toString() : undefined,
  };

  return { success: 200, data: user };
}

// Admin service

export async function serviceDeleteUserById(user_id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return { error: httpBadRequestError, data: "Invalid user ID" };
  }

  const data = await UserModel.findById(user_id);
  if (!data) {
    return { error: httpNotFoundError, data: "User not found" };
  }

  await data.deleteOne();

  if (data.cv_url) {
    await deleteS3Keys(extractS3KeyFromUrl(data.cv_url) || "");
  }

  return { success: 204 };
}

export async function serviceAdminGetAllUsers(): retService<
  components["schemas"]["data-user-short"][]
> {
  const data = await UserModel.find();
  if (!data) {
    return { error: httpNotFoundError, data: "Users not found" };
  }

  const users: components["schemas"]["data-user-short"][] = data.map(
    (item): components["schemas"]["data-user-short"] => ({
      id: item.id,
      name: item.name,
    }),
  );

  return { success: 200, data: users };
}
