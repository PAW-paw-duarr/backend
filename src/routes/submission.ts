import express from "express";
import z from "zod";
import {
  serviceGetAllSubmissions,
  serviceGetSubmissionById,
  serviceResponseSubmission,
  serviceCreateASubmission,
} from "~/services/submissionService.js";
import { httpInternalServerError, sendHttpError } from "~/utils/httpError.js";
import { uploadTmp } from "~/lib/multer.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const user = res.locals.user;

  try {
    const submissions = await serviceGetAllSubmissions(user);
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
  const titleId = req.params.id;
  const currentUser = res.locals.user;

  try {
    const service = await serviceGetSubmissionById(titleId, currentUser);
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

const submitSchema = z.object({
  title_id: z.string(),
});

router.post("/submit", uploadTmp.single("grand_design"), async (req, res) => {
  const title_id = req.body.title_id;
  const parseReqBody = submitSchema.safeParse({ title_id });

  if (!parseReqBody.success) {
    res.status(400).json({ error: "Invalid request", details: z.treeifyError(parseReqBody.error) });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const user = res.locals.user;
  try {
    const service = await serviceCreateASubmission(user, {
      title_id,
      grand_design_url: req.file.path,
    });

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
  const parseReqBody = responseSchema.safeParse({ id, accept });
  if (!parseReqBody.success) {
    res.status(400).json({ error: "Invalid request", details: z.treeifyError(parseReqBody.error) });
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
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export default router;
