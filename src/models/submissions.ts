import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
import { TeamsClass } from "./teams";

@modelOptions({ schemaOptions: { collection: "submissions" } })
export class SubmissionsClass {
  public id!: string;

  @prop({ required: true, ref: () => TeamsClass })
  public team!: Ref<TeamsClass>;

  @prop({ required: true, ref: () => TeamsClass })
  public team_target!: Ref<TeamsClass>;

  @prop({ required: true, type: String })
  public grand_design_url!: string;

  @prop({ required: true, type: Boolean, default: false })
  public accepted!: boolean;

  public static async findById(this: ReturnModelType<typeof SubmissionsClass>, id: string) {
    return this.findOne({ _id: id });
  }

  public static async getAllData(this: ReturnModelType<typeof SubmissionsClass>) {
    return this.find({}, { id: 1, team_id: 1, team_target_id: 1 });
  }
}

export const SubmissionModel = getModelForClass(SubmissionsClass);
