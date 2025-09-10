import express from "express";
import z from "zod";
import {
  serviceGetAllSubmissions,
  serviceGetSubmissionById,
  serviceResponseSubmission,
  serviceCreateASubmission,
} from "~/services/submissionService.js";
import { httpBadRequestError, httpInternalServerError, sendHttpError } from "~/utils/httpError.js";
import { uploadTmp } from "~/lib/multer.js";
import { deleteS3Keys, publicUrlFromKey, putFromDisk } from "~/lib/s3.js";
import path from "node:path";
import { safeUnlink } from "~/lib/file.js";

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
const uploadGrandDesign = uploadTmp.fields([{ name: "grand_design", maxCount: 1 }]);
router.post("/submit", uploadGrandDesign, async (req, res) => {
  const { title_id } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;
  const grandDesign = files?.grand_design?.[0];

  const parseReqBody = submitSchema.safeParse({ title_id });
  if (!parseReqBody.success) {
    await safeUnlink(grandDesign?.path);
    res.status(400).json({ error: "Invalid request", details: z.treeifyError(parseReqBody.error) });
    return;
  }

  console.log(grandDesign?.path);
  if (!grandDesign) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  if (grandDesign.mimetype !== "application/pdf") {
    await safeUnlink(grandDesign.path);
    sendHttpError({ res, error: httpBadRequestError, message: "Invalid file type" });
    return;
  }

  const user = res.locals.user;
  const uid = crypto.randomUUID();
  const grandDesignKey = `grand_design/${uid}-${path.extname(grandDesign.originalname).toLowerCase()}`;

  try {
    const uploadedGrandDesignKey = await putFromDisk(
      grandDesign.path,
      grandDesignKey,
      grandDesign.mimetype,
    );

    await safeUnlink(grandDesign.path);

    const service = await serviceCreateASubmission(user, {
      title_id,
      grand_design_url: publicUrlFromKey(uploadedGrandDesignKey),
    });

    if (service.success === undefined) {
      await deleteS3Keys(grandDesignKey);
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
  } catch {
    await safeUnlink(grandDesign.path);
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
