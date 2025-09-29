import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "titles" } })
export class TitleClass {
  public id!: string;

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

  @prop({ required: true, type: Number })
  public period!: number;

  @prop({ required: true, type: Boolean, default: false })
  public is_taken!: boolean;
}

export const TitleModel = getModelForClass(TitleClass);
