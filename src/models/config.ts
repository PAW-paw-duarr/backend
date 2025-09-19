import { getModelForClass, modelOptions, prop, type ReturnModelType } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "config" } })
export class ConfigClass {
  public id!: string;

  @prop({ required: true, type: Number })
  public config_id!: number;

  @prop({ required: true, type: Number })
  public current_period!: number;

  public static async getConfig(this: ReturnModelType<typeof ConfigModel>) {
    const config = await this.findOne({ config_id: 1 });
    if (!config) {
      // TODO: handle this case properly
      return { current_period: 0, config_id: 0 };
    }
    return config;
  }
}

export const ConfigModel = getModelForClass(ConfigClass);
