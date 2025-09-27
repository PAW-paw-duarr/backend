import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
import { TeamModel } from "~/models/teams.js";
import { type UserClass, UserModel } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import {
  httpBadRequestError,
  httpNotFoundError,
  httpUnauthorizedError,
} from "~/utils/httpError.js";

export async function serviceGetTeamById(
  id: string,
): retService<components["schemas"]["data-team"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid team ID" };
  }

  const data = await TeamModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Team not found" };
  }

  const team: components["schemas"]["data-team"] = {
    id: data.id,
    name: data.name,
    leader_email: data.leader_email,
    category: data.category,
    title_id: data.title ? data.title._id.toString() : undefined,
    period: data.period,
    code: data.code,
  };

  return { success: 200, data: team };
}

export async function serviceKickMemberTeam(userId: string, currentUser: UserClass): retService {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { error: httpBadRequestError, data: "Invalid user ID" };
  }

  const currentTeam = await TeamModel.findOne({ _id: currentUser.team?._id.toString() });
  const currentUserId = currentUser.id;
  if (userId === currentUserId || currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "You cannot kick this member" };
  }

  const data = await UserModel.findByIdAndUpdate(userId, { team_id: null });
  if (!data) {
    return { error: httpNotFoundError, data: "Member Not Found" };
  }

  return { success: 204 };
}

export async function serviceJoinTeam(
  code: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-team"]> {
  const team = await TeamModel.findOne({ code });
  if (!team) {
    return { error: httpNotFoundError, data: "Team not found" };
  }

  const data = await UserModel.findByIdAndUpdate(currentUser.id, { team });
  if (!data) {
    return { error: httpNotFoundError, data: "Member Not Found" };
  }

  return { success: 200, data: team };
}

// Admin service

export async function serviceAdminDeleteTeamById(team_id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(team_id)) {
    return { error: httpBadRequestError, data: "Invalid submission title ID" };
  }

  const data = await TeamModel.findById(team_id);
  if (!data) {
    return { error: httpNotFoundError, data: "Title not found" };
  }

  await TeamModel.deleteOne({ _id: team_id });
  await UserModel.updateMany({ team_id: team_id }, { team_id: null });

  return { success: 204 };
}

export async function serviceAdminGetAllTeams(): retService<components["schemas"]["data-team"][]> {
  const datas = await TeamModel.find();
  const teams: components["schemas"]["data-team"][] = datas.map((data) => ({
    id: data.id,
    name: data.name,
    leader_email: data.leader_email,
    category: data.category,
    title_id: data.title ? data.title._id.toString() : undefined,
    period: data.period,
    code: data.code,
  }));

  return { success: 200, data: teams };
}

export async function serviceAdminGetTeamById(
  id: string,
): retService<components["schemas"]["data-team"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid team ID" };
  }

  const data = await TeamModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Team not found" };
  }

  const team: components["schemas"]["data-team"] = {
    id: data.id,
    name: data.name,
    leader_email: data.leader_email,
    category: data.category,
    title_id: data.title ? data.title._id.toString() : undefined,
    period: data.period,
    code: data.code,
  };
  return { success: 200, data: team };
}