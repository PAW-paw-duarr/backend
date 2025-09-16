import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
import { Types } from "mongoose";
import { TeamsClass } from "./teams.js";

@modelOptions({
  schemaOptions: {
    collection: "users",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class UserClass {
  // virtual string id (dari _id) akan tersedia karena virtuals: true
  public id!: string;

  @prop({ required: true, type: String, trim: true })
  public name!: string;

  @prop({
    required: true,
    unique: true,
    type: String,
    lowercase: true,
    trim: true,
    index: true,
  })
  public email!: string;

  @prop({ type: String })
  public google_id?: string;

  @prop({ type: String })
  public password?: string;

  @prop({ ref: () => TeamsClass, type: () => Types.ObjectId })
  public team?: Ref<TeamsClass>;

  @prop({ type: String })
  public cv_url?: string;

  @prop({ required: true, type: Boolean, default: false })
  public is_admin!: boolean;

  // ===== Static Methods =====
  public static async getAllData(this: ReturnModelType<typeof UserClass>) {
    // kembalikan list pendek (id + name), gunakan lean untuk performa
    return this.find({}, { _id: 1, name: 1 }).lean<{ _id: Types.ObjectId; name: string }>().exec();
  }

  public static async createUserPassword(
    this: ReturnModelType<typeof UserClass>,
    params: CreateUserPasswordParams,
  ): Promise<UserClass> {
    const { name, email, password } = params;

    const existing = await this.findOne({ email }).lean().exec();
    if (existing) {
      throw new Error("User with this email already exists");
    }

    // TODO: hash password sebelum save (bcrypt)
    const user = new this({ name, email, password });
    await user.save();
    return user;
  }

  public static async createOrFindUserGoogle(
    this: ReturnModelType<typeof UserClass>,
    params: CreateUserGoogleParams,
  ): Promise<UserClass> {
    const { name, email, google_id } = params;

    // Email diwajibkan agar konsisten dengan schema
    if (!email) throw new Error("Email is required for Google user");

    const existing = await this.findOne({ email }).exec();
    if (existing) return existing;

    const user = new this({ name, email, google_id });
    await user.save();
    return user;
  }
}

// Export model Typegoose (pakai default export biar import mudah)
const UserModel = getModelForClass(UserClass);
export default UserModel;

// ===== Types for params =====
export interface CreateUserPasswordParams {
  email: string;
  password: string;
  name: string;
}

export interface CreateUserGoogleParams {
  email: string; // wajibkan agar konsisten
  name?: string;
  google_id: string;
}
