import path from "node:path";
import express from "express";
import z from "zod";
import { safeUnlink } from "~/lib/file.js";
import { uploadTmp } from "~/lib/multer.js";
import { deleteS3Keys, publicUrlFromKey, putFromDisk } from "~/lib/s3.js";
import {
  serviceAdminDeleteSubmissionById,
  serviceAdminGetAllSubmissions,
  serviceAdminGetSubmissionById,
  serviceCreateASubmission,
  serviceGetAllSubmissions,
  serviceGetSubmissionById,
  serviceResponseSubmission,
} from "~/services/submissionService.js";
import { httpBadRequestError, httpInternalServerError, sendHttpError } from "~/utils/httpError.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const currentUser = res.locals.user;

  try {
    const submissions = currentUser.is_admin
      ? await serviceAdminGetAllSubmissions()
      : await serviceGetAllSubmissions(currentUser);
    if (submissions.success === undefined) {
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
  const currentUser = res.locals.user;

  try {
    const service = currentUser.is_admin
      ? await serviceAdminGetSubmissionById(id)
      : await serviceGetSubmissionById(id, currentUser);
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
  team_target_id: z.string(),
});
const uploadGrandDesign = uploadTmp.fields([{ name: "grand_design", maxCount: 1 }]);
router.post("/submit", uploadGrandDesign, async (req, res) => {
  const { team_target_id } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;
  const grandDesign = files?.grand_design?.[0];

  const parseReqBody = submitSchema.safeParse({ team_target_id });
  if (!parseReqBody.success) {
    await safeUnlink(grandDesign?.path);
    res.status(400).json({ error: "Invalid request", details: z.treeifyError(parseReqBody.error) });
    return;
  }

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
      team_target_id: parseReqBody.data.team_target_id,
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
    const service = await serviceResponseSubmission(
      parseReqBody.data.id,
      user,
      parseReqBody.data.accept,
    );
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

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const currentUser = res.locals.user;

  if (!currentUser.is_admin) {
    sendHttpError({
      res,
      error: httpBadRequestError,
      message: "Unauthorized",
    });
    return;
  }

  try {
    const service = await serviceAdminDeleteSubmissionById(id);
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
