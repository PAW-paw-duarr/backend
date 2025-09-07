import express from "express";
import z from "zod";
import {
  serviceGetAllSubmission,
  serviceGetSubmissionById,
  serviceResponseSubmission,
} from "~/services/submissionService.js";
import { httpInternalServerError, sendHttpError } from "~/utils/httpError.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const user = res.locals.user;

  try {
    const submissions = await serviceGetAllSubmission(user);
    if (submissions.error) {
      res.status(submissions.error.status).json({ error: submissions.data });
      return;
    }

    res.json(submissions.data);
    return;
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const user = res.locals.user;

  try {
    const service = await serviceGetSubmissionById(id, user);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

const responseSchema = z.object({
  id: z.string(),
  accept: z.boolean(),
});
router.post("/response", async (req, res) => {
  const { id, accept } = req.body;
  const parseResult = responseSchema.safeParse({ id, accept });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: z.treeifyError(parseResult.error) });
    return;
  }

  const user = res.locals.user;
  try {
    const service = await serviceResponseSubmission(id, user, accept);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
    return;
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export default router;
