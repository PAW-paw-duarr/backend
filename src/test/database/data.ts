import mongoose from "mongoose";
import type { ConfigClass } from "~/models/config.js";
import type { TeamsClass } from "~/models/teams.js";
import type { TitleClass } from "~/models/titles.js";
import type { UserClass } from "~/models/users.js";
import { CategoryCapstone } from "~/utils/constants.js";

type titleData = Omit<TitleClass, "id"> & {
  _id?: mongoose.Types.ObjectId;
};
type userData = Omit<UserClass, "id"> & { _id?: mongoose.Types.ObjectId };
type teamsData = Omit<TeamsClass, "id"> & { _id?: mongoose.Types.ObjectId };

// Config data
export const configData: Omit<ConfigClass, "id"> = {
  config_id: 1,
  current_period: 2,
};

export const titleData: titleData[] = [
  {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    desc: "desc",
    description: "descccc",
    photo_url: "https://example.com/photos/5352e569-8ba9-4f6b-832f-24bc2922f002-.png",
    proposal_url: "https://example.com/proposals/5352e569-8ba9-4f6b-832f-24bc2922f002-.pdf",
    title: "title",
    period: 1,
  },
  {
    _id: new mongoose.Types.ObjectId("68cd31a4f937b6abf158f041"),
    desc: "desc",
    description: "descccc",
    photo_url: "https://example.com/photos/5352e569-8ba9-4f6b-832f-24bc2922f002-.png",
    proposal_url: "https://example.com/proposals/5352e569-8ba9-4f6b-832f-24bc2922f002-.pdf",
    title: "title2",
    period: 0,
  },
];

export const userData: userData[] = [
  {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7b"),
    name: "tes1",
    email: "tes1@mail.com",
    password: "tes1",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    cv_url: "https://example.com/cvs/tes1.pdf",
    is_admin: false,
  },
  {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7c"),
    name: "tes2",
    email: "tes2@mail.com",
    password: "tes2",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"),
    cv_url: "https://example.com/cvs/tes2.pdf",
    is_admin: false,
  },
  {
    _id: new mongoose.Types.ObjectId("68cd3817d7b90ccdc43ef6a7"),
    name: "tes3",
    email: "tes3@mail.com",
    password: "tes3",
    team: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"),
    cv_url: "https://example.com/cvs/tes3.pdf",
    is_admin: false,
  },
];

export const teamsData: teamsData[] = [
  {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
    name: "tes1",
    leader_email: "tes1@mail.com",
    category: CategoryCapstone.Kesehatan,
    period: 1,
    code: "aaa",
    title: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7a"),
  },
  {
    _id: new mongoose.Types.ObjectId("68cd31179097773ac24c2b7d"),
    name: "tes2",
    leader_email: "tes2@mail.com",
    category: CategoryCapstone.Kesehatan,
    period: 1,
    code: "bbb",
  },
];
