import { SubmissionModel } from "~/models/submissions.js";
import type { UserClass } from "~/models/users.js";
import type { components } from "~/lib/api/schema.js";
import { type TitleClass, TitleModel } from "~/models/titles.js";
import type { retService } from "~/types/service.js";
import { TeamModel } from "~/models/teams.js";
import {
  httpUnauthorizedError,
  httpBadRequestError,
  httpNotFoundError,
} from "~/utils/httpError.js";
import mongoose from "mongoose";

export async function serviceGetAllTitles(): retService<
  components["schemas"]["data-title-short"][]
> {
  const data = await TitleModel.getAllData();

  const titles: components["schemas"]["data-title-short"][] = data.map(
    (item): components["schemas"]["data-title-short"] => ({
      id: item.id,
      title: item.title,
      desc: item.desc,
      photo_url: item.photo_url,
    }),
  );

  return { success: 200, data: titles };
}

// GET /titles/:id
export async function serviceGetTitleByID(
  id: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-title"]> {
  const data = await TitleModel.findById(id);
  if (!data) {
    return { error: httpBadRequestError, data: "Title not found" };
  }

  // check if the user is owner of the title or has an accepted submission to it
  const titleOwnerTeam = await TitleModel.findOne({ title: data.id });
  const acceptedSubmission = await SubmissionModel.findOne({
    team: currentUser.team?._id.toString(),
    title: data.id,
    accepted: true,
  });
  const allowGetProposal = !!(
    titleOwnerTeam?.id === currentUser.team?._id.toString() || acceptedSubmission
  );

  const titles: components["schemas"]["data-title"] = {
    id: data.id,
    title: data.title,
    desc: data.desc,
    description: data.description,
    photo_url: data.photo_url,
    ...(allowGetProposal && {
      proposal_url: data.proposal_url,
    }),
  };
  return { success: 200, data: titles };
}

// POST /titles
export async function serviceCreateTitle(
  currentUser: UserClass,
  payload: Omit<TitleClass, "id">,
): retService<components["schemas"]["data-title"]> {
  // check if current user is team leader
  const userTeam = await TeamModel.findById(currentUser.team?._id.toString());
  if (currentUser.email !== userTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can create title" };
  }

  const data = await TitleModel.create(payload);
  const title: components["schemas"]["data-title"] = {
    id: data.id,
    title: data.title,
    desc: data.desc,
    description: data.description,
    photo_url: data.photo_url,
    proposal_url: data.proposal_url,
  };
  return { success: 201, data: title };
}

// PATCH /titles/:id
export async function serviceUpdateTitle(
  id: string,
  currentUser: UserClass,
  payload: Omit<TitleClass, "id">,
): retService<components["schemas"]["data-title"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid title ID" };
  }

  const data = await TitleModel.findById(id);
  if (!data) {
    return { error: httpBadRequestError, data: "Title not found" };
  }

  // check if current user is team leader and the owner of the title
  const titleOwnerTeam = await TeamModel.findOne({ title: data.id });
  if (titleOwnerTeam?.id !== currentUser.team?._id.toString()) {
    return {
      error: httpBadRequestError,
      data: "Only team leader and owner of the title can update title",
    };
  }

  //check if has already submission to this title
  const hasSubmission = await SubmissionModel.findOne({
    team: currentUser.team?._id.toString(),
    title: data.id,
  });
  if (hasSubmission) {
    return { error: httpBadRequestError, data: "Cannot update title after submission" };
  }

  // update the title
  await TitleModel.updateOne({ id }, payload);
  const updatedData = await TitleModel.findById(id);
  if (!updatedData) {
    return { error: httpNotFoundError, data: "Title not found after update" };
  }

  const title: components["schemas"]["data-title"] = {
    id: updatedData.id,
    title: updatedData.title,
    desc: updatedData.desc,
    description: updatedData.description,
    photo_url: updatedData.photo_url,
  };

  return { success: 200, data: title };
}

// Admin Services
export async function serviceDeleteTitleByID(title_id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(title_id)) {
    return { error: httpBadRequestError, data: "Invalid title ID" };
  }

  const data = await TitleModel.findById(title_id);
  if (!data) {
    return { error: httpNotFoundError, data: "Title not found" };
  }

  await TitleModel.deleteOne({ id: title_id });
  await SubmissionModel.deleteMany({ title: title_id });
  await TeamModel.updateMany({ title: title_id }, { title: null });

  return { success: 204 };
}

// Services for admin to Get title by ID
export async function servicesAdminGetTitleByID(
  id: string,
): retService<components["schemas"]["data-title"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid Submission ID" };
  }

  const data = await TitleModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Title not found" };
  }
  const titles: components["schemas"]["data-title"] = {
    id: data.id,
    title: data.title,
    desc: data.desc,
    description: data.description,
    photo_url: data.photo_url,
    proposal_url: data.proposal_url,
  };
  return { success: 200, data: titles };
}

// Services for admin to Get all titles with detailed info
export async function servicesAdminGetAllTitles(): retService<
  components["schemas"]["data-title"][]
> {
  const data = await TitleModel.getAllData();
  if (!data) {
    return { error: httpNotFoundError, data: "No titles found" };
  }

  const titles: components["schemas"]["data-title"][] = data.map((item) => ({
    id: item.id,
    title: item.title,
    desc: item.desc,
    description: item.description,
    photo_url: item.photo_url,
    proposal_url: item.proposal_url,
  }));

  return { success: 200, data: titles };
}
