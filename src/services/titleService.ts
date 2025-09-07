import type { components } from "~/lib/api/schema.js";
import { SubmissionModel } from "~/models/submissions.js";
import { TeamModel } from "~/models/teams.js";
import { type TitleClass, TitleModel } from "~/models/titles.js";
import type { UserClass } from "~/models/users.js";
import type { retService } from "~/types/service.js";
import { httpBadRequestError, httpUnauthorizedError } from "~/utils/httpHelper.js";

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

export async function serviceGetTitleById(
  id: string,
  currentUser: UserClass,
): retService<components["schemas"]["data-title"]> {
  const data = await TitleModel.findById(id);
  if (!data) {
    return { error: { status: 404, message: "Title not found" }, data: "Title not found" };
  }

  // check if current user is the owner of the title or has an accepted submission to it
  const titleOwnerTeam = await TeamModel.findOne({ title: data.id });
  const acceptedSubmission = await SubmissionModel.findOne({
    team: currentUser.team?.id,
    team_target: titleOwnerTeam?.id,
    accepted: true,
  });
  const allowGetProposal = !!(titleOwnerTeam?.id === currentUser.team?.id || acceptedSubmission);

  const title: components["schemas"]["data-title"] = {
    id: data.id,
    title: data.title,
    desc: data.desc,
    description: data.description,
    photo_url: data.photo_url,
    ...(allowGetProposal && {
      proposal_url: data.proposal_url,
    }),
  };

  return { success: 200, data: title };
}

export async function serviceCreateTitle(
  currentUser: UserClass,
  payload: TitleClass,
): retService<components["schemas"]["data-title"]> {
  // check if current user is team leader
  const currentTeam = await TeamModel.findOne({ id: currentUser.team?.id });
  if (currentUser.email !== currentTeam?.leader_email) {
    return { error: httpUnauthorizedError, data: "Only team leader can respond to submissions" };
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

export async function serviceUpdateTitle(
  id: string,
  currentUser: UserClass,
  payload: TitleClass,
): retService<components["schemas"]["data-title"]> {
  const data = await TitleModel.findById(id);
  if (!data) {
    return { error: { status: 404, message: "Title not found" }, data: "Title not found" };
  }

  // check if current user is the owner leader of the title
  const titleOwnerTeam = await TeamModel.findOne({ title: data.id });
  if (titleOwnerTeam?.leader_email !== currentUser.email) {
    return { error: httpUnauthorizedError, data: "Only title owner can update the title" };
  }

  // check if already has submission to this title
  const hasSubmission = await SubmissionModel.exists({ team: titleOwnerTeam?.id });
  if (hasSubmission) {
    return {
      error: httpBadRequestError,
      data: "Cannot update title after having submissions",
    };
  }

  await TitleModel.updateOne({ id }, payload);
  const updatedData = await TitleModel.findById(id);
  if (!updatedData) {
    return { error: { status: 404, message: "Title not found" }, data: "Title not found" };
  }

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
