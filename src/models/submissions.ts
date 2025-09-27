import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { TeamsClass } from "./teams.js";

@modelOptions({ schemaOptions: { collection: "submissions" } })
export class SubmissionsClass {
  public id!: string;

  @prop({ required: true, ref: () => TeamsClass })
  public team!: Ref<TeamsClass>;

  @prop({ required: true, ref: () => TeamsClass })
  public team_target!: Ref<TeamsClass>;

  @prop({ required: true, type: String })
  public grand_design_url!: string;

  @prop({ type: Boolean })
  public accepted?: boolean;

  public static async findByIdLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    id: string,
    currentTeamId: string,
  ) {
    return this.findOne({
      _id: new mongoose.Types.ObjectId(id),
      $or: [{ team: currentTeamId }, { team_target: currentTeamId }],
    });
  }

  public static async getAllDataLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    currentTeamId: string,
  ) {
    return this.find({ $or: [{ team: currentTeamId }, { team_target: currentTeamId }] });
  }

  public static async updateAcceptedLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    id: string,
    currentTeamId: string,
    accept: boolean,
  ) {
    return this.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), team_target: currentTeamId },
      { accepted: accept },
      { new: true, runValidators: true },
    );
  }

  public static async createNewSubmission(
    this: ReturnModelType<typeof SubmissionsClass>,
    teamId: string,
    teamTargetId: string,
    grandDesignUrl: string,
  ) {
    return this.create({
      team: teamId,
      team_target: teamTargetId,
      grand_design_url: grandDesignUrl,
    });
  }
}

export const SubmissionModel = getModelForClass(SubmissionsClass);
