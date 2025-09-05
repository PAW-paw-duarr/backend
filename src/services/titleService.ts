import { TitleModel } from "../models/titles";

export async function getAllTitles() {
  return await TitleModel.getAllData();
}
