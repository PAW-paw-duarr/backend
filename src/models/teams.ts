import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
  type ReturnModelType,
} from "@typegoose/typegoose";
import { CategoryCapstone } from "../utils/constants";

@modelOptions({ schemaOptions: { collection: "teams" } })
class TeamsClass {
  @prop({ required: true, type: String })
  public name!: string;

  @prop({ required: true, type: String })
  public leader_email!: string;

  @prop({ required: true, enum: CategoryCapstone, type: String })
  public category!: CategoryCapstone;

  @prop({ type: mongoose.Types.ObjectId })
  public title_id?: mongoose.Types.ObjectId;

  @prop({ type: Number })
  public period?: number;

  public static async findById(this: ReturnModelType<typeof TeamsClass>, id: string) {
    return this.findOne({ _id: id }).lean().exec();
  }

  public static async getAllData(this: ReturnModelType<typeof TeamsClass>) {
    return this.find({}, { id: 1, name: 1, category: 1 }).lean().exec();
  }
}

export const TeamModel = getModelForClass(TeamsClass);
