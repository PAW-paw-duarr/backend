import { Router } from "express";
import type { components } from "../lib/api/schema";
import { serviceGetAllTitles } from "../services/titleService";
import { httpNotFoundError, sendHttpError } from "../utils/httpError";

const router = Router();

router.get("/", async (_, res) => {
  const titles = await serviceGetAllTitles();
  if (titles.length === 0) {
    sendHttpError({ res, error: httpNotFoundError, message: "No titles found" });
    return;
  }
  const resp: components["schemas"]["data-title-short"][] = titles.map(({ _id, ...rest }) => ({
    id: _id.toString(),
    ...rest,
  }));
  res.json(resp);
});

export default router;
