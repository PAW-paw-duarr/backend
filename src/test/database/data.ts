import mongoose from "mongoose";
import type { ConfigClass } from "~/models/config.js";
import type { SubmissionsClass } from "~/models/submissions.js";
import type { TeamsClass } from "~/models/teams.js";
import type { TitleClass } from "~/models/titles.js";
import type { UserClass } from "~/models/users.js";
import { CategoryCapstone } from "~/utils/constants.js";

type titleData = Omit<TitleClass, "id"> & {
  _id?: mongoose.Types.ObjectId;
};
type userData = Omit<UserClass, "id"> & { _id?: mongoose.Types.ObjectId };
type teamsData = Omit<TeamsClass, "id"> & { _id?: mongoose.Types.ObjectId };
type submissionData = Omit<SubmissionsClass, "id"> & {
  _id?: mongoose.Types.ObjectId;
};

// Config data
export const configData: Omit<ConfigClass, "id"> = {
  config_id: 1,
  current_period: 2,
};

export const titleData: Record<string, titleData> = {
  currentPeriodTitle: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    desc: "desc",
    description: "descccc",
    photo_url: "https://example.com/photos/5352e569-8ba9-4f6b-832f-24bc2922f002-.png",
    proposal_url: "https://example.com/proposals/5352e569-8ba9-4f6b-832f-24bc2922f002-.pdf",
    title: "title",
    period: configData.current_period,
    is_taken: false,
  },
  previousPeriodTitle: {
    _id: new mongoose.Types.ObjectId("68cd31a4f937b6abf158f041"),
    desc: "desc",
    description: "descccc",
    photo_url: "https://example.com/photos/5352e569-8ba9-4f6b-832f-24bc2922f002-.png",
    proposal_url: "https://example.com/proposals/5352e569-8ba9-4f6b-832f-24bc2922f002-.pdf",
    title: "title2",
    period: configData.current_period - 1,
    is_taken: false,
  },
};

export const createTitlePayload: Omit<titleData, "period" | "_id" | "is_taken"> = {
  title: "New Title",
  desc: "New desc",
  description: "New description",
  photo_url: "https://example.com/photo.png",
  proposal_url: "https://example.com/proposal.pdf",
};

export const userData: Record<string, userData> = {
  teamLeaderWithTitle: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7b"),
    name: "tes1",
    email: "tes1@mail.com",
    password: "tes1",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    cv_url: "https://example.com/cvs/tes1.pdf",
    is_admin: false,
  },
  teamMemberWithTitle: {
    _id: new mongoose.Types.ObjectId("68d7c67dfb870a538f78bebb"),
    name: "tes11",
    email: "tes11@mail.com",
    password: "tes11",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    cv_url: "https://example.com/cvs/tes3.pdf",
    is_admin: false,
  },
  teamLeaderWithoutTitle: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7c"),
    name: "tes2",
    email: "tes2@mail.com",
    password: "tes2",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"),
    cv_url: "https://example.com/cvs/tes2.pdf",
    is_admin: false,
  },
  teamMemberWithoutTitle: {
    _id: new mongoose.Types.ObjectId("68cd3817d7b90ccdc43ef6a7"),
    name: "tes3",
    email: "tes3@mail.com",
    password: "tes3",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"),
    cv_url: "https://example.com/cvs/tes3.pdf",
    is_admin: false,
  },
  adminUser: {
    _id: new mongoose.Types.ObjectId("68cd3817d7b90ccdc43ef6a8"),
    name: "Admin User",
    email: "admin@mail.com",
    password: "admin123",
    cv_url: "https://example.com/cvs/admin.pdf",
    is_admin: true,
  },
  userWithoutTeam: {
    _id: new mongoose.Types.ObjectId("68cd3817d7b90ccdc43ef6a9"),
    name: "No Team User",
    email: "noteam@mail.com",
    password: "noteam123",
    cv_url: "https://example.com/cvs/noteam.pdf",
    is_admin: false,
  },
  userWithoutTeam2: {
    _id: new mongoose.Types.ObjectId("68cd3817d7b90ccdc43ef6aa"),
    name: "No Team User 2",
    email: "noteam2@mail.com",
    password: "noteam123",
    cv_url: "https://example.com/cvs/noteam2.pdf",
    is_admin: false,
  },
  userWithGoogleAuth: {
    _id: new mongoose.Types.ObjectId("68d7b9efec4278bd59d2ab28"),
    name: "Google Auth User",
    email: "google@mail.com",
    google_id: "google-oauth2|123456789012345678901",
    cv_url: "https://example.com/cvs/google.pdf",
    is_admin: false,
  },
};

export const teamsData: Record<string, teamsData> = {
  teamWithTitleCurrentPeriod: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    name: "tes1",
    leader_email: "tes1@mail.com",
    category: CategoryCapstone.Kesehatan,
    period: configData.current_period,
    code: "aaa",
    title: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
  },
  teamWithTitlePreviousPeriod: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7b"),
    name: "tes3",
    leader_email: "tes3@mail.com",
    category: CategoryCapstone.Kesehatan,
    period: configData.current_period - 1,
    code: "ccc",
    title: new mongoose.Types.ObjectId("68cd31a4f937b6abf158f041"),
  },
  teamWithoutTitle: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"),
    name: "tes2",
    leader_email: "tes2@mail.com",
    category: CategoryCapstone.Kesehatan,
    period: configData.current_period,
    code: "bbb",
  },
};

export const submissionData: Record<string, submissionData> = {
  submissionFromTeamA: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2c1a"),
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"), // teamWithTitleCurrentPeriod
    team_target: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"), // teamWithoutTitle
    grand_design_url: "https://example.com/submissions/design1.pdf",
    accepted: true,
  },
  submissionFromTeamB: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2c1b"),
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"), // teamWithoutTitle
    team_target: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"), // teamWithTitleCurrentPeriod
    grand_design_url: "https://example.com/submissions/design2.pdf",
    accepted: true,
  },
  submissionAccepted: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2c1c"),
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"), // teamWithTitleCurrentPeriod
    team_target: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7b"), // teamWithTitlePreviousPeriod
    grand_design_url: "https://example.com/submissions/design3.pdf",
    accepted: true,
  },
  submissionRejected: {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2c1d"),
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7b"), // teamWithTitlePreviousPeriod
    team_target: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"), // teamWithTitleCurrentPeriod
    grand_design_url: "https://example.com/submissions/design4.pdf",
    accepted: false,
  },
};

export const createSubmissionPayload = {
  team_target_id: "68cd31179097773ac24c2b7b",
  grand_design_url: "https://example.com/submissions/new-design.pdf",
};

export const createTeamPayload = [
  {
    name: "Test Team Creation",
    leader_email: "noteam@mail.com",
    category: CategoryCapstone.Kesehatan,
  },
  {
    name: "Test Team Creation 2",
    leader_email: "noteam2@mail.com",
    category: CategoryCapstone.SmartCity,
  },
];

export const updateUserPayload = {
  name: "Updated Name",
  email: "updated@mail.com",
  cv_url: "https://example.com/cvs/updated.pdf",
};
