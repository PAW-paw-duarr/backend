import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import type { UserClass } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import {
  httpBadRequestError,
  httpNotFoundError,
  httpUnauthorizedError,
} from "~/utils/httpHelper.js";

export async function serviceGetAllSubmission(
  currentUser: UserClass,
): retService<components["schemas"]["data-submission-short"][]> {
  const data = await SubmissionModel.getAllDataLimited(currentUser.team?.id);

  const submission: components["schemas"]["data-submission-short"][] = data.map(
    (item): components["schemas"]["data-submission-short"] => ({
      id: item.id,
      team_id: item.team.id,
      team_target_id: item.team_target.id,
      title_id: item.title?.id,
    }),
  );

  return { success: 200, data: submission };
}

export async function serviceGetSubmissionById(
  id: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const data = await SubmissionModel.findByIdLimited(id, currentUser.team?.id);
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  const submission: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team.id,
    team_target_id: data.team_target.id,
    grand_design_url: data.grand_design_url,
    title_id: data.title?.id,
    accepted: data.accepted ?? false,
  };

  return { success: 200, data: submission };
}

export async function serviceResponseSubmission(
  id: string,
  currentUser: UserClass,
  accept: boolean,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  // check if current user is team leader
  const currentTeam = await TeamModel.findOne({ id: currentUser.team?.id });
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can respond to submissions" };
  }

  const data = await SubmissionModel.findOneAndUpdate({ id: id }, { accepted: accept });
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  const submission: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team.id,
    team_target_id: data.team_target.id,
    grand_design_url: data.grand_design_url,
    title_id: data.title?.id,
    accepted: data.accepted,
  };

  return { success: 200, data: submission };
}

type payloadSubmitSubmission = {
  title_id: string;
  grand_design_url: string;
};
export async function serviceSubmitSubmission(
  currentUser: UserClass,
  payload: payloadSubmitSubmission,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(payload.title_id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  // check if current user is team leader
  const currentTeam = await TeamModel.findOne({ id: currentUser.team?.id });
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can respond to submissions" };
  }

  const titleOwnerTeam = await TeamModel.findOne({ title: payload.title_id });
  if (!titleOwnerTeam) {
    return { error: httpNotFoundError, data: "Title owner team not found" };
  }

  const submission = await SubmissionModel.create({
    team: currentUser.team?.id,
    team_target: titleOwnerTeam.id,
    title: payload.title_id,
    grand_design_url: payload.grand_design_url,
  });

  const result: components["schemas"]["data-submission"] = {
    id: submission.id,
    team_id: submission.team.id,
    team_target_id: submission.team_target.id,
    grand_design_url: submission.grand_design_url,
    title_id: submission.title?.id,
    accepted: submission.accepted,
  };

  return { success: 200, data: result };
}
