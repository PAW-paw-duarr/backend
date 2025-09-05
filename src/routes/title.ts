import { type Response, Router } from "express";
import type { components } from "../lib/api/schema";
import { getAllTitles } from "../services/titleService";
import { httpNotFoundError, sendHttpError } from "../utils/httpError";

const router = Router();

router.get("/", async (_, res: Response) => {
  const titles = await getAllTitles();
  if (titles.length === 0) {
    sendHttpError(res, httpNotFoundError);
    return;
  }
  const resp: components["schemas"]["data-title-short"][] = titles.map(({ _id, ...rest }) => ({
    id: _id.toString(),
    ...rest,
  }));
  res.json(resp);
});

export default router;
