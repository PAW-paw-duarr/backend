import { getModelForClass, mongoose, prop, ReturnModelType } from "@typegoose/typegoose";

class ProfileClass {
    public id!: mongoose.Types.ObjectId;

    @prop()
    public name?: string;

    @prop()
    public email?: string;

    @prop()
    public password?: number;

    @prop()
    public team_id?: mongoose.Types.ObjectId;

    @prop()
    public cv_url?: string;

    public static async findByEmail(this: ReturnModelType<typeof ProfileClass>, email: string) {
        return this.findOne({ email }).exec();
    }
}

export const ProfileModel = getModelForClass(ProfileClass);