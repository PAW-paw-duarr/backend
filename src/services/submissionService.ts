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
 * Service for GET `/submission`: get all submissions within restrictions.
 * @param {UserClass} currentUser Current user information.
 * @returns {retService<components["schemas"]["data-submission-short"][]>}
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
    }),
  );

  return { success: 200, data: submissions };
}

/**
 * Service for GET `/submission/{id}`: find the matching submission by ID within restrictions.
 * @param {string} id The searched submission ID.
 * @param {UserClass} currentUser Current user information.
 * @returns {retService<components["schemas"]["data-submission"]>}
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
  };

  return { success: 200, data: submissionData };
}

/**
 * Service for POST `/submission/response`: the owner team's response to the inherited submission (accept/decline).
 * @param {string} id The submission ID to respond to.
 * @param {UserClass} currentUser Current user information.
 * @param {boolean} accept Accept/decline the submission.
 * @returns {retService<components["schemas"]["data-submission"]>}
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
/**
 * Service for POST `/submission/submit`: submit a multipart/form-data information and create a new document based on the payload.
 * @param {UserClass} currentUser Current user information.
 * @param {payloadSubmission} payload Request body payload.
 * @returns {retService<components["schemas"]["data-submission"]>}
 */
export async function serviceCreateASubmission(
  currentUser: UserClass,
  payload: payloadSubmission,
): retService<components["schemas"]["data-submission"]> {
  const currentTeam = await TeamModel.findOne({ _id: currentUser.team?._id }, { leader_email: 1 });
  console.log(currentUser.email);
  console.log(currentTeam?.leader_email);
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can submit" };
  }

  const existingSubmission = await SubmissionModel.findOne({ team: currentUser.team?._id });
  if (existingSubmission) {
    return {
      error: httpBadRequestError,
      data: "A submission from the same team already exists",
    };
  }

  const data = await SubmissionModel.createNewSubmission(
    currentUser.team?._id.toString() || "",
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

// ===== ADMIN SERVICES =====

/**
 * Service for GET `/submission`: get all submissions — **ADMIN ONLY**.
 * @returns {retService<components["schemas"]["data-submission-short"][]>}
 */
export async function serviceAdminGetAllSubmissions(): retService<
  components["schemas"]["data-submission-short"][]
> {
  const data = await SubmissionModel.getAllData();
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

/**
 * Service for GET `/submission/{id}`: find the matching submission by ID — **ADMIN ONLY**.
 * @param {string} id The searched submission ID.
 * @returns {retService<components["schemas"]["data-submission"]>}
 */
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
  };

  return { success: 200, data: submissionData };
}

/**
 * Service for DELETE `/submission/{id}`: remove a submission by ID without restrictions — **ADMIN ONLY**.
 * @param {string} id The submission ID to be deleted.
 * @returns {retService<undefined>}
 */
export async function serviceAdminDeleteSubmissionById(id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid submission ID" };
  }

  const data = await SubmissionModel.deleteById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Submission not found" };
  }

  return { success: 204 };
}
