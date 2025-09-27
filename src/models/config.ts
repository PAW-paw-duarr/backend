import { getModelForClass, modelOptions, prop, type ReturnModelType } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "config" } })
export class ConfigClass {
  public id!: string;

  @prop({ required: true, type: Number })
  public config_id!: number;

  @prop({ required: true, type: Number })
  public current_period!: number;

  public static async getConfig(this: ReturnModelType<typeof ConfigModel>) {
    const existingConfig = await this.findOne({ config_id: 1 });
    if (!existingConfig) {
      const newConfig = new this({ config_id: 1, current_period: 0 });
      await newConfig.save();
      return newConfig;
    }
    return existingConfig;
  }
}

export const ConfigModel = getModelForClass(ConfigClass);
