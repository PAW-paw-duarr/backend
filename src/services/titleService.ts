import type { components } from "~/lib/api/schema";
import { TitleModel } from "../models/titles";
import type { retService } from "./helper";

export async function serviceGetAllTitles(): retService<
  components["schemas"]["data-title-short"][]
> {
  const data = await TitleModel.getAllData();
  const titles: components["schemas"]["data-title"][] = data.map(({ _id, ...rest }) => ({
    id: _id.toString(),
    ...rest,
  }));
  return { success: 200, data: titles };
}
