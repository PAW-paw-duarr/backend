import type { components } from "~/lib/api/schema";
import { TitleModel } from "~/models/titles";
import type { retService } from "~/types/service";

export async function serviceGetAllTitles(): retService<
  components["schemas"]["data-title-short"][]
> {
  const data = await TitleModel.getAllData();

  const titles: components["schemas"]["data-title-short"][] = data.map(
    (item): components["schemas"]["data-title-short"] => ({
      id: item.id,
      title: item.title,
      desc: item.desc,
      photo_url: item.photo_url,
    }),
  );

  return { success: 200, data: titles };
}
