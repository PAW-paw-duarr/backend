import {
  getModelForClass,
  modelOptions,
  type mongoose,
  prop,
  type ReturnModelType,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "users" } })
class UserClass {
  public id!: string;

  @prop({ required: true, type: String })
  public name!: string;

  @prop({ required: true, unique: true, type: String })
  public email!: string;

  @prop({ type: String })
  public google_id?: string;

  @prop({ type: String })
  public password?: string;

  @prop({ type: String })
  public team_id?: mongoose.Types.ObjectId;

  @prop({ type: String })
  public cv_url?: string;

  @prop({ required: true, type: Boolean, default: false })
  public is_admin!: boolean;

  public static async findById(this: ReturnModelType<typeof UserClass>, id: string) {
    return this.findOne({ _id: id });
  }

  public static async findByEmail(this: ReturnModelType<typeof UserClass>, email: string) {
    return this.findOne({ email });
  }

  public static async getAllData(this: ReturnModelType<typeof UserClass>) {
    return this.find({}, { _id: 1, name: 1 });
  }

  public static async createUserPassword(
    this: ReturnModelType<typeof UserClass>,
    params: createUserPasswordParams,
  ): Promise<UserClass | Error> {
    const { name, email, password } = params;
    const existingUser = await this.findOne({ email });
    if (existingUser) {
      return new Error("User with this email already exists");
    }
    const user = new this({ name, email, password });
    await user.save();
    return user;
  }

  public static async createOrFindUsergoogle(
    this: ReturnModelType<typeof UserClass>,
    params: createUserGoogleParams,
  ): Promise<UserClass> {
    const { name, email, google_id } = params;
    const existingUser = await this.findOne({ email });
    if (existingUser) {
      return existingUser;
    }
    const user = new this({ name, email, google_id });
    await user.save();
    return user;
  }
}

export const UserModel = getModelForClass(UserClass);
export type UserDocument = UserClass;

export interface createUserPasswordParams {
  email: string;
  password: string;
  name: string;
}

interface createUserGoogleParams {
  email?: string;
  name?: string;
  google_id: string;
}
