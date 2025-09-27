import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
import { deleteS3Keys, extractS3KeyFromUrl } from "~/lib/s3.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import type { UserClass } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import {
  httpBadRequestError,
  httpInternalServerError,
  httpNotFoundError,
  httpUnauthorizedError,
} from "~/utils/httpError.js";

export async function serviceGetAllSubmissions(
  currentUser: UserClass,
): retService<components["schemas"]["data-submission-short"][]> {
  const currentTeam = await TeamModel.findById(currentUser.team?._id);
  if (!currentTeam) {
    return { error: httpBadRequestError, data: "User is not in a team" };
  }

  const data = await SubmissionModel.getAllDataLimited(currentTeam._id.toString());
  if (!data) {
    return { error: httpNotFoundError, data: "Submissions not found" };
  }

  const submissions: components["schemas"]["data-submission-short"][] = data.map(
    (item): components["schemas"]["data-submission-short"] => ({
      id: item.id,
      team_id: item.team._id.toString(),
      team_target_id: item.team_target._id.toString(),
    }),
  );

  return { success: 200, data: submissions };
}

export async function serviceGetSubmissionById(
  id: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const currentTeam = await TeamModel.findById(currentUser.team?._id);
  if (!currentTeam) {
    return { error: httpBadRequestError, data: "User is not in a team" };
  }

  const data = await SubmissionModel.findByIdLimited(id, currentTeam._id.toString());
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  const submissionData: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team._id.toString(),
    grand_design_url: data.grand_design_url,
    team_target_id: data.team_target._id.toString(),
    accepted: data.accepted,
  };

  return { success: 200, data: submissionData };
}

export async function serviceResponseSubmission(
  id: string,
  currentUser: UserClass,
  accept: boolean,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const currentTeam = await TeamModel.findOne(
    { _id: currentUser.team?._id },
    { id: 1, leader_email: 1 },
  );
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can respond to submissions" };
  }

  const data = await SubmissionModel.updateAcceptedLimited(
    id,
    currentTeam?._id.toString() || "",
    accept,
  );
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  const submission: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team._id.toString(),
    grand_design_url: data.grand_design_url,
    team_target_id: data.team_target._id.toString(),
    accepted: data.accepted,
  };

  return { success: 200, data: submission };
}

type payloadSubmission = {
  team_target_id: string;
  grand_design_url: string;
};
export async function serviceCreateASubmission(
  currentUser: UserClass,
  payload: payloadSubmission,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(payload.team_target_id)) {
    return { error: httpBadRequestError, data: "Invalid target team ID" };
  }

  const currentTeam = await TeamModel.findById(currentUser.team?._id);

  if (!currentTeam) {
    return { error: httpBadRequestError, data: "User is not in a team" };
  }

  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can create submissions" };
  }

  if (currentTeam.id === payload.team_target_id) {
    return { error: httpBadRequestError, data: "Cannot submit to your own team" };
  }

  const targetTeam = await TeamModel.findById(payload.team_target_id);
  if (!targetTeam) {
    return { error: httpNotFoundError, data: "Target team not found" };
  }

  const existingSubmission = await SubmissionModel.findOne({
    team: currentUser.team?._id,
    team_target: payload.team_target_id,
  });
  if (existingSubmission) {
    return {
      error: httpBadRequestError,
      data: "A submission from the same team already exists",
    };
  }

  const data = await SubmissionModel.createNewSubmission(
    currentTeam._id.toString(),
    payload.team_target_id,
    payload.grand_design_url,
  );
  if (!data) {
    return { error: httpInternalServerError, data: "Failed to create a new submission" };
  }

  const submission: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team._id.toString(),
    grand_design_url: data.grand_design_url,
    team_target_id: data.team_target._id.toString(),
    accepted: data.accepted,
  };

  return { success: 201, data: submission };
}

// admin services

export async function serviceAdminGetAllSubmissions(): retService<
  components["schemas"]["data-submission-short"][]
> {
  const data = await SubmissionModel.find();
  if (!data) {
    return { error: httpNotFoundError, data: "Submissions not found" };
  }

  const submissions: components["schemas"]["data-submission-short"][] = data.map(
    (item): components["schemas"]["data-submission-short"] => ({
      id: item.id,
      team_id: item.team._id.toString(),
      team_target_id: item.team_target._id.toString(),
    }),
  );

  return { success: 200, data: submissions };
}

export async function serviceAdminGetSubmissionById(
  id: string,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const data = await SubmissionModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  const submissionData: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team._id.toString(),
    grand_design_url: data.grand_design_url,
    team_target_id: data.team_target._id.toString(),
    accepted: data.accepted,
  };

  return { success: 200, data: submissionData };
}

export async function serviceAdminDeleteSubmissionById(id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const data = await SubmissionModel.findByIdAndDelete(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  if (data.grand_design_url) {
    await deleteS3Keys(extractS3KeyFromUrl(data.grand_design_url) || "");
  }

  return { success: 204 };
}
