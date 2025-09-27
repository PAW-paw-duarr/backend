import { getModelForClass, modelOptions, prop, type Ref } from "@typegoose/typegoose";
import { CategoryCapstone } from "~/utils/constants.js";
import { TitleClass } from "./titles.js";

@modelOptions({ schemaOptions: { collection: "teams" } })
export class TeamsClass {
  public id!: string;

  @prop({ required: true, type: String })
  public name!: string;

  @prop({ required: true, type: String })
  public leader_email!: string;

  @prop({ required: true, enum: CategoryCapstone, type: String })
  public category!: CategoryCapstone;

  @prop({ ref: () => TitleClass })
  public title?: Ref<TitleClass>;

  @prop({ required: true, type: Number })
  public period!: number;

  @prop({ required: true, type: String })
  public code!: string;
}

export const TeamModel = getModelForClass(TeamsClass);
