import type { components } from "~/lib/api/schema";
import { TitleModel } from "~/models/titles";
import type { retService } from "~/types/service";

export async function serviceGetAllTitles(): retService<
  components["schemas"]["data-title-short"][]
> {
  const data = await TitleModel.getAllData();

  const titles: components["schemas"]["data-title"][] = data.map((item) => ({
    id: item.id,
    desc: item.desc,
    description: item.description,
    photo_url: item.photo_url,
    proposal_url: item.proposal_url,
    title: item.title,
  }));

  return { success: 200, data: titles };
}
