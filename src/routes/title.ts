import { Router } from "express";
import z from "zod";
import { serviceGetAllTitles } from "~/services/titleService.js";
import { sendHttpError } from "~/utils/httpHelper.js";

const router = Router();

router.get("/", async (_, res) => {
  const service = await serviceGetAllTitles();
  if (service.success === undefined) {
    sendHttpError({ res, error: service.error, message: service.data });
    return;
  }

  res.status(service.success).json(service.data);
});

// export const createTitleSchema = z.object({
//   photo_url: z.url(),
//   title: z.string(),
//   desc: z.string().max(255),
//   description: z.string(),
//   proposal_url: z.url(),
// });
// router.post("/", (_, res) => {

export default router;
