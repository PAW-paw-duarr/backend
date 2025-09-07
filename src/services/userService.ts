import type { components } from "~/lib/api/schema.js";
import { type UserClass, UserModel } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import { httpNotFoundError } from "~/utils/httpError.js";

export async function serviceGetUserById(
  id: string,
): retService<components["schemas"]["data-user"]> {
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
  const data = await UserModel.findByIdAndUpdate(currentUser.id, payload);
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
