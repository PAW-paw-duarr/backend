import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
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

  public static async findById(this: ReturnModelType<typeof TeamsClass>, id: string) {
    return this.findOne({ _id: id });
  }

  public static async getAllData(this: ReturnModelType<typeof TeamsClass>) {
    return this.find({}, { id: 1, name: 1, category: 1 });
  }
}

export const TeamModel = getModelForClass(TeamsClass);
