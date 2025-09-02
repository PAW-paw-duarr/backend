import {
  getModelForClass,
  modelOptions,
  type mongoose,
  prop,
  type ReturnModelType,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "users" } })
class UserClass {
  @prop({ required: true, type: String })
  public name!: string;

  @prop({ type: String })
  public google_id?: string;

  @prop({ type: String })
  public email?: string;

  @prop({ type: String })
  public password?: number;

  @prop({ type: String })
  public team_id?: mongoose.Types.ObjectId;

  @prop({ type: String })
  public cv_url?: string;

  public static async findById(this: ReturnModelType<typeof UserClass>, id: string) {
    return this.findOne({ _id: id }).lean().exec();
  }

  public static async findByEmail(this: ReturnModelType<typeof UserClass>, email: string) {
    return this.findOne({ email }).lean().exec();
  }

  public static async getAllData(this: ReturnModelType<typeof UserClass>) {
    return this.find({}, { id: 1, name: 1 }).lean().exec();
  }
}

export const UserModel = getModelForClass(UserClass);
