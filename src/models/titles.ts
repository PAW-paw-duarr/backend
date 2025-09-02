import { getModelForClass, modelOptions, prop, type ReturnModelType } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "titles" } })
class TitleClass {
  @prop({ required: true, type: String })
  public desc!: string;

  @prop({ required: true, type: String })
  public description!: string;

  @prop({ required: true, type: String })
  public photo_url!: string;

  @prop({ required: true, type: String })
  public proposal_url!: string;

  @prop({ required: true, type: String })
  public title!: string;

  public static async findById(this: ReturnModelType<typeof TitleClass>, id: string) {
    return this.findOne({ _id: id }).lean().exec();
  }

  public static async getAllData(this: ReturnModelType<typeof TitleClass>) {
    return this.find(
      {},
      { id: 1, desc: 1, description: 1, photo_url: 1, proposal_url: 1, title: 1 },
    )
      .lean()
      .exec();
  }
}

export const TitleModel = getModelForClass(TitleClass);
