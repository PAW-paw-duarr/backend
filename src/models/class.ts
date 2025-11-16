import { getModelForClass } from "@typegoose/typegoose";
import { TeamsClass } from "./teams.js";
import { TitleClass } from "./titles.js";

export const TeamModel = getModelForClass(TeamsClass);

export const TitleModel = getModelForClass(TitleClass);
