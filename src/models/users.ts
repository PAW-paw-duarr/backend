import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
import { logger } from "~/lib/logger.js";
import { TeamsClass } from "./teams.js";

@modelOptions({ schemaOptions: { collection: "users" } })
export class UserClass {
  public id!: string;

  @prop({ required: true, type: String, trim: true })
  public name!: string;

  @prop({ required: true, unique: true, type: String, lowercase: true, trim: true })
  public email!: string;

  @prop({ type: String })
  public google_id?: string;

  @prop({ type: String })
  public password?: string;

  @prop({ ref: () => TeamsClass })
  public team?: Ref<TeamsClass>;

  @prop({ type: String })
  public cv_url?: string;

  @prop({ required: true, type: Boolean, default: false })
  public is_admin!: boolean;

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
      if (!existingUser.google_id) {
        existingUser.google_id = google_id;
        await existingUser.save();
      }
      return existingUser;
    }
    const user = new this({ name, email, google_id });
    await user.save();
    logger.info({ email: params.email }, `User google created`);
    return user;
  }
}

export const UserModel = getModelForClass(UserClass);

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
