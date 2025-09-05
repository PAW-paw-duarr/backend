import { TitleModel } from "../models/titles";

export async function serviceGetAllTitles() {
  return await TitleModel.getAllData();
}
