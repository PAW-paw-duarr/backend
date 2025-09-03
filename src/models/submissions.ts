import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
  type ReturnModelType,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "submissions" } })
class SubmissionsClass {
  @prop({ required: true, type: mongoose.Types.ObjectId })
  public team_id!: mongoose.Types.ObjectId;

  @prop({ required: true, type: mongoose.Types.ObjectId })
  public team_target_id!: mongoose.Types.ObjectId;

  @prop({ required: true, type: String })
  public grand_design_url!: string;

  @prop({ required: true, type: Boolean, default: false })
  public accepted!: boolean;

  public static async findById(this: ReturnModelType<typeof SubmissionsClass>, id: string) {
    return this.findOne({ _id: id }).lean().exec();
  }

  public static async getAllData(this: ReturnModelType<typeof SubmissionsClass>) {
    return this.find({}, { id: 1, team_id: 1, team_target_id: 1 }).lean().exec();
  }
}

export const TeamModel = getModelForClass(SubmissionsClass);
