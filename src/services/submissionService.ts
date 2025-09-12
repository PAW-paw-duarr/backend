import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
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

/**
 * Service for /submission: get all submissions within restrictions.
 * @param currentUser Current user information.
 * @returns
 */
export async function serviceGetAllSubmissions(
  currentUser: UserClass,
): retService<components["schemas"]["data-submission-short"][]> {
  const data = await SubmissionModel.getAllDataLimited(currentUser.team?._id.toString() || "");
  if (!data) {
    return { error: httpNotFoundError, data: "Submissions not found" };
  }

  const submissions: components["schemas"]["data-submission-short"][] = data.map(
    (item): components["schemas"]["data-submission-short"] => ({
      id: item.id,
      team_id: item.team._id.toString(),
      team_target_id: item.team_target._id.toString(),
      title_id: item.title?._id.toString(),
    }),
  );

  return { success: 200, data: submissions };
}

/**
 * Service for /submission/:id: find the matching submission within restrictions.
 * @param id The searched submission ID.
 * @param {UserClass} currentUser Current user information.
 * @returns
 */
export async function serviceGetSubmissionById(
  id: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const data = await SubmissionModel.findByIdLimited(id, currentUser.team?._id.toString() || "");
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  const submissionData: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team._id.toString(),
    grand_design_url: data.grand_design_url,
    team_target_id: data.team_target._id.toString(),
    accepted: data.accepted ?? false,
    title_id: data.title._id.toString(),
  };

  return { success: 200, data: submissionData };
}

/**
 * Service for `/submission/response`: the owner team's response to the inherited submission (accept/decline).
 * @param id
 * @param currentUser
 * @param accept
 * @returns
 */
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

  const data = await SubmissionModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), team_target: currentTeam?.id },
    {
      accepted: accept,
    },
    {
      new: true,
    },
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
    title_id: data.title?._id.toString(),
  };

  return { success: 200, data: submission };
}

type payloadSubmission = {
  title_id: string;
  grand_design_url: string;
};
/**
 * Service for /submission/submit: submit a multipart/form-data information and create a new document based on the payload.
 * @param currentUser Current user information.
 * @param payload Request body payload.
 * @returns
 */
export async function serviceCreateASubmission(
  currentUser: UserClass,
  payload: payloadSubmission,
): retService<components["schemas"]["data-submission"]> {
  if (!mongoose.Types.ObjectId.isValid(payload.title_id)) {
    return { error: httpBadRequestError, data: "Invalid submission title ID" };
  }

  const currentTeam = await TeamModel.findOne({ _id: currentUser.team?._id }, { leader_email: 1 });
  console.log(currentUser.email);
  console.log(currentTeam?.leader_email);
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can submit" };
  }

  const titleOwnerTeam = await TeamModel.findOne({ title: payload.title_id });
  if (!titleOwnerTeam) {
    return { error: httpNotFoundError, data: "Title referenced not found" };
  }

  const data = await SubmissionModel.create({
    team: currentUser.team?._id.toString(),
    team_target: titleOwnerTeam.id,
    title: payload.title_id,
    grand_design_url: payload.grand_design_url,
  });
  if (!data) {
    return { error: httpInternalServerError, data: "Failed to create a new submission" };
  }

  const submission: components["schemas"]["data-submission"] = {
    id: data.id,
    team_id: data.team._id.toString(),
    grand_design_url: data.grand_design_url,
    team_target_id: data.team_target._id.toString(),
    accepted: data.accepted,
    title_id: data.title._id.toString(),
  };

  return { success: 201, data: submission };
}

// Admin service

export async function serviceAdminDeleteSubmissionById(id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  await SubmissionModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
  });

  return { success: 204 };
}

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
      title_id: item.title?._id.toString(),
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
    accepted: data.accepted ?? false,
    title_id: data.title._id.toString(),
  };

  return { success: 200, data: submissionData };
}
