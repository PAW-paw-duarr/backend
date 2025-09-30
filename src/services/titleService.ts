import mongoose from "mongoose";
import type { components } from "~/lib/api/schema.js";
import { logger } from "~/lib/logger.js";
import { deleteS3Keys, extractS3KeyFromUrl } from "~/lib/s3.js";
import { ConfigModel } from "~/models/config.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import { type TitleClass, TitleModel } from "~/models/titles.js";
import type { UserClass } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import {
  httpBadRequestError,
  httpNotFoundError,
  httpUnauthorizedError,
} from "~/utils/httpError.js";

export async function serviceGetAllTitles(): retService<
  components["schemas"]["data-title-short"][]
> {
  const config = await ConfigModel.getConfig();
  const data = await TitleModel.find({ period: config.current_period - 1 });

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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid title ID" };
  }

  const data = await TitleModel.findById(id);
  if (!data) {
    return { error: httpNotFoundError, data: "Title not found" };
  }

  // check if the user is owner of the title or has an accepted submission to it
  const titleOwnerTeam = await TeamModel.findOne({ title: data.id });
  const acceptedSubmission = await SubmissionModel.findOne({
    team: currentUser.team?._id,
    team_target: titleOwnerTeam?._id,
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
  payload: Omit<TitleClass, "id" | "period" | "is_taken">,
): retService<components["schemas"]["data-title"]> {
  // check if current user is team leader
  const currentTeam = await TeamModel.findById(currentUser.team?._id.toString());
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can create title" };
  }

  // check if the team already has a title
  if (currentTeam?.title) {
    return { error: httpBadRequestError, data: "Team already has a title" };
  }

  const data = await TitleModel.create({ period: currentTeam.period, ...payload });
  logger.info(
    { team_id: currentTeam?._id.toString(), title_id: data._id.toString() },
    "Title created",
  );

  const title: components["schemas"]["data-title"] = {
    id: data.id,
    title: data.title,
    desc: data.desc,
    description: data.description,
    photo_url: data.photo_url,
    proposal_url: data.proposal_url,
    is_taken: data.is_taken,
  };

  // assign the title to the team
  currentTeam.title = data._id;
  await currentTeam.save();

  return { success: 201, data: title };
}

// PATCH /titles/:id
export async function serviceUpdateTitle(
  currentUser: UserClass,
  payload: Partial<Omit<TitleClass, "id">>,
): retService<components["schemas"]["data-title"]> {
  const currentTeam = await TeamModel.findById(currentUser.team?._id.toString());
  if (!currentTeam?.title) {
    return { error: httpBadRequestError, data: "Your team does not have a title to update" };
  }
  if (currentUser.email !== currentTeam.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can update title" };
  }

  //check if has already submission to this title
  const hasSubmission = await SubmissionModel.findOne({
    team_target: currentTeam._id,
  });
  if (hasSubmission) {
    return { error: httpBadRequestError, data: "Cannot update title after submission" };
  }

  // update the title and get the updated document
  const updatedData = await TitleModel.findByIdAndUpdate(currentTeam.title._id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updatedData) {
    return { error: httpNotFoundError, data: "Title not found" };
  }
  logger.info({ title_id: currentTeam.title._id.toString() }, "Title updated");

  const title: components["schemas"]["data-title"] = {
    id: updatedData.id,
    title: updatedData.title,
    desc: updatedData.desc,
    description: updatedData.description,
    photo_url: updatedData.photo_url,
    proposal_url: updatedData.proposal_url,
  };

  return { success: 200, data: title };
}

// Admin Services
export async function serviceAdminDeleteTitleByID(title_id: string): retService<undefined> {
  if (!mongoose.Types.ObjectId.isValid(title_id)) {
    return { error: httpBadRequestError, data: "Invalid title ID" };
  }

  const data = await TitleModel.findByIdAndDelete(title_id);
  if (!data) {
    return { error: httpNotFoundError, data: "Title not found" };
  }

  if (data.proposal_url) {
    await deleteS3Keys(extractS3KeyFromUrl(data.proposal_url) || "");
  }

  if (data.photo_url) {
    await deleteS3Keys(extractS3KeyFromUrl(data.photo_url) || "");
  }

  for (const submission of await SubmissionModel.find({ title: title_id })) {
    await TeamModel.updateOne({ _id: submission.team }, { $pull: { submissions: submission._id } });
    await SubmissionModel.findByIdAndDelete(submission._id);
    if (submission.grand_design_url) {
      await deleteS3Keys(extractS3KeyFromUrl(submission.grand_design_url) || "");
    }
  }

  // remove the title from the team
  await TeamModel.updateMany({ title: title_id }, { $unset: { title: "" } });

  logger.info({ title_id }, "Title deleted by admin");
  return { success: 204 };
}

// Services for admin to Get title by ID
export async function serviceAdminGetTitleByID(
  id: string,
): retService<components["schemas"]["data-title"]> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: httpBadRequestError, data: "Invalid title ID" };
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
export async function serviceAdminGetAllTitles(): retService<
  components["schemas"]["data-title-short"][]
> {
  const data = await TitleModel.find();

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
