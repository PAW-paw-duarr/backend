import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
import { TeamsClass } from "./teams.js";
import { TitleClass } from "./titles.js";

@modelOptions({ schemaOptions: { collection: "submissions" } })
export class SubmissionsClass {
  public id!: string;

  @prop({ required: true, ref: () => TitleClass })
  public title!: Ref<TitleClass>;

  @prop({ required: true, ref: () => TeamsClass })
  public team!: Ref<TeamsClass>;

  @prop({ required: true, ref: () => TeamsClass })
  public team_target!: Ref<TeamsClass>;

  @prop({ required: true, type: String })
  public grand_design_url!: string;

  @prop({ required: true, type: Boolean })
  public accepted?: boolean;

  // get submission by id where current team is either the submitter or the target
  public static async findByIdLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    id: string,
    currentTeamId: string,
  ) {
    return this.findOne({
      id: id,
      $or: [{ team: currentTeamId }, { team_target: currentTeamId }],
    });
  }

  public static async getAllData(this: ReturnModelType<typeof SubmissionsClass>) {
    return this.find({}, { id: 1, team: 1, team_target: 1, title: 1 });
  }

  // get all submissions where current team is either the submitter or the target
  public static async getAllDataLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    currentTeamId: string,
  ) {
    return this.find(
      { id: 1, team: 1, team_target: 1, title: 1 },
      { $or: [{ team_target: currentTeamId }, { team: currentTeamId }] },
    );
  }
}

export const SubmissionModel = getModelForClass(SubmissionsClass);
