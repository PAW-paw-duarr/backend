import { Router } from "express";
import { serviceGetAllTitles } from "~/services/titleService.js";
import { sendHttpError } from "~/utils/httpError.js";

const router = Router();

router.get("/", async (_, res) => {
  const resp = await serviceGetAllTitles();
  if (resp.success === undefined) {
    sendHttpError({ res, error: resp.error, message: resp.data });
    return;
  }

  res.status(200).json(resp.data);
});

export default router;
