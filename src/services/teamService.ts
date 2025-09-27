import nodeCrypto from "node:crypto";
import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
import { ConfigModel } from "~/models/config.js";
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
  currentUser: UserClass,
): retService<components["schemas"]["data-team"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid team ID" };
  }

  const data = await TeamModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Team not found" };
  }

  const member = await UserModel.find({ team: data._id });
  const memberData: components["schemas"]["data-user-short"][] = [];
  member.forEach((m) => {
    memberData.push({
      id: m.id,
      name: m.name,
    });
  });

  const team: components["schemas"]["data-team"] = {
    id: data.id,
    name: data.name,
    leader_email: data.leader_email,
    category: data.category,
    title_id: data.title ? data.title._id.toString() : undefined,
    period: data.period,
    code: data.code,
    member: memberData,
  };

  if (currentUser.team?._id.toString() !== id && !currentUser.is_admin) {
    delete team.code;
  }

  return { success: 200, data: team };
}

export async function serviceKickMemberTeam(userId: string, currentUser: UserClass): retService {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { error: httpBadRequestError, data: "Invalid user ID" };
  }

  const targetUser = await UserModel.findById(userId);
  if (!targetUser) {
    return { error: httpNotFoundError, data: "Member Not Found" };
  }
  if (!targetUser.team) {
    return { error: httpBadRequestError, data: "Member is not in a team" };
  }

  const currentTeam = await TeamModel.findById(currentUser.team?._id.toString());
  const currentUserId = currentUser.id;
  if (
    userId === currentUserId ||
    currentUser.email !== currentTeam?.leader_email ||
    targetUser.team._id.toString() !== currentTeam?._id.toString()
  ) {
    return { error: httpUnauthorizedError, data: "You cannot kick this member" };
  }

  const data = await UserModel.findByIdAndUpdate(userId, { $unset: { team: 1 } });
  if (!data) {
    return { error: httpNotFoundError, data: "Member Not Found" };
  }

  return { success: 204 };
}

export async function serviceJoinTeam(
  code: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-team"]> {
  if (currentUser.team) {
    return { error: httpBadRequestError, data: "User already has a team" };
  }

  const team = await TeamModel.findOne({ code: code });
  if (!team) {
    return { error: httpNotFoundError, data: "Team not found" };
  }

  const data = await UserModel.findByIdAndUpdate(currentUser.id, { team: team._id });
  if (!data) {
    return { error: httpNotFoundError, data: "Member Not Found" };
  }

  const formattedTeam: components["schemas"]["data-team"] = {
    id: team.id,
    name: team.name,
    leader_email: team.leader_email,
    category: team.category,
    title_id: team.title ? team.title._id.toString() : undefined,
    period: team.period,
    code: team.code,
  };

  return { success: 200, data: formattedTeam };
}

// Admin service

export async function serviceAdminDeleteTeamById(team_id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(team_id)) {
    return { error: httpBadRequestError, data: "Invalid team ID" };
  }

  const data = await TeamModel.findById(team_id);
  if (!data) {
    return { error: httpNotFoundError, data: "Team not found" };
  }

  await data.deleteOne();
  await UserModel.updateMany({ team: team_id }, { $unset: { team: "" } });

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

export async function serviceAdminCreateTeams(
  teamData: components["schemas"]["data-team-new"][],
  new_period?: boolean,
): Promise<{
  success: number;
  data: components["schemas"]["RespGenerateNewTeam"];
}> {
  let period: number;
  if (new_period) {
    const config = await ConfigModel.getConfig();
    period = config.current_period + 1;
    await ConfigModel.updateOne({ current_period: period });
  } else {
    const config = await ConfigModel.getConfig();
    period = config.current_period;
  }

  const successfulTeams: components["schemas"]["data-team"][] = [];
  const errorData: Array<{
    name: string;
    leader_email: string;
    category: components["schemas"]["data-team-new"]["category"];
    error: string;
  }> = [];
  let successCount = 0;
  let errorCount = 0;

  for (const team of teamData) {
    try {
      const teamToCreate = {
        name: team.name,
        leader_email: team.leader_email,
        category: team.category,
        period: period,
        code: nodeCrypto.randomUUID().replace(/-/g, ""),
      };

      const insertedTeam = await TeamModel.create(teamToCreate);

      const formattedTeam: components["schemas"]["data-team"] = {
        id: insertedTeam.id,
        name: insertedTeam.name,
        leader_email: insertedTeam.leader_email,
        category: insertedTeam.category,
        title_id: insertedTeam.title ? insertedTeam.title._id.toString() : undefined,
        period: insertedTeam.period,
        code: insertedTeam.code,
      };

      successfulTeams.push(formattedTeam);
      successCount++;
    } catch (error) {
      errorData.push({
        name: team.name,
        leader_email: team.leader_email,
        category: team.category,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      errorCount++;
    }
  }

  const returnData: components["schemas"]["RespGenerateNewTeam"] = {
    period: period,
    success_count: successCount,
    error_count: errorCount,
    ...(successfulTeams.length > 0 && { data: successfulTeams }),
    ...(errorData.length > 0 && { error_data: errorData }),
  };

  return { success: 201, data: returnData };
}
