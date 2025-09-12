import path from "node:path";
import { Router } from "express";
import z from "zod";
import { safeUnlink } from "~/lib/file.js";
import { uploadTmp } from "~/lib/multer.js";
import { deleteS3Keys, publicUrlFromKey, putFromDisk } from "~/lib/s3.js";
import {
  serviceAdminGetTitleById,
  serviceCreateTitle,
  serviceDeleteTitleById,
  serviceGetAllTitles,
  serviceGetTitleById,
  serviceUpdateTitle,
} from "~/services/titleService.js";
import {
  httpBadRequestError,
  httpInternalServerError,
  httpUnauthorizedError,
  sendHttpError,
} from "~/utils/httpError.js";

const router = Router();

router.get("/", async (_, res) => {
  try {
    const service = await serviceGetAllTitles();
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

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const user = res.locals.user;

  try {
    const service = user.is_admin
      ? await serviceAdminGetTitleById(id)
      : await serviceGetTitleById(id, user);

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

export const createTitleSchema = z.object({
  title: z.string(),
  desc: z.string().max(255),
  description: z.string(),
});
const uploadCreateTitle = uploadTmp.fields([
  { name: "proposal_file", maxCount: 1 },
  { name: "photo_file", maxCount: 1 },
]);
router.post("/", uploadCreateTitle, async (req, res) => {
  const user = res.locals.user;
  const { title, desc, description } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;
  const proposalFile = files?.proposal_file?.[0];
  const photoFile = files?.photo_file?.[0];

  const parseResult = createTitleSchema.safeParse({ title, desc, description });
  if (!parseResult.success) {
    await safeUnlink(proposalFile?.path, photoFile?.path);
    sendHttpError({
      res,
      error: httpBadRequestError,
      detail: z.treeifyError(parseResult.error),
    });
    return;
  }

  if (proposalFile.mimetype !== "application/pdf" || !/^image\//.test(photoFile.mimetype)) {
    await safeUnlink(proposalFile.path, photoFile.path);
    sendHttpError({ res, error: httpBadRequestError, message: "Invalid file types" });
    return;
  }

  const uid = crypto.randomUUID();
  const proposalKey = `proposals/${uid}-${path.extname(proposalFile.originalname).toLowerCase()}`;
  const photoKey = `photos/${uid}-${path.extname(photoFile.originalname).toLowerCase()}`;

  try {
    // Upload from local tmp → S3
    const uploadedProposalKey = await putFromDisk(
      proposalFile.path,
      proposalKey,
      proposalFile.mimetype,
    );
    const uploadedPhotoKey = await putFromDisk(photoFile.path, photoKey, photoFile.mimetype);

    // tmp files no longer needed
    await safeUnlink(proposalFile.path, photoFile.path);

    const service = await serviceCreateTitle(user, {
      title: parseResult.data.title,
      desc: parseResult.data.desc,
      description: parseResult.data.description,
      proposal_url: publicUrlFromKey(uploadedProposalKey),
      photo_url: publicUrlFromKey(uploadedPhotoKey),
    });

    if (service.success === undefined) {
      await deleteS3Keys(uploadedProposalKey, uploadedPhotoKey);
      return sendHttpError({ res, error: service.error, message: service.data });
    }

    res.status(service.success).json(service.data);
    return;
  } catch {
    await safeUnlink(proposalFile.path, photoFile.path);
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export const updateTitleSchema = z.object({
  title: z.string().optional(),
  desc: z.string().max(255).optional(),
  description: z.string().optional(),
});
const uploadUpdateTitle = uploadTmp.fields([
  { name: "proposal_file", maxCount: 1 },
  { name: "photo_file", maxCount: 1 },
]);
router.patch("/:id", uploadUpdateTitle, async (req, res) => {
  const user = res.locals.user;
  const id = req.params.id;
  const { title, desc, description } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;
  const proposalFile = files?.proposal_file?.[0];
  const photoFile = files?.photo_file?.[0];

  const parseResult = createTitleSchema.safeParse({ title, desc, description });
  if (!parseResult.success) {
    await safeUnlink(proposalFile?.path, photoFile?.path);
    sendHttpError({
      res,
      error: httpBadRequestError,
      detail: z.treeifyError(parseResult.error),
    });
    return;
  }

  if (proposalFile.mimetype !== "application/pdf" || !/^image\//.test(photoFile.mimetype)) {
    await safeUnlink(proposalFile.path, photoFile.path);
    sendHttpError({ res, error: httpBadRequestError, message: "Invalid file types" });
    return;
  }

  const uid = crypto.randomUUID();
  const proposalKey = `proposals/${uid}-${path.extname(proposalFile.originalname).toLowerCase()}`;
  const photoKey = `photos/${uid}-${path.extname(photoFile.originalname).toLowerCase()}`;

  try {
    // Upload from local tmp → S3
    const uploadedProposalKey = await putFromDisk(
      proposalFile.path,
      proposalKey,
      proposalFile.mimetype,
    );
    const uploadedPhotoKey = await putFromDisk(photoFile.path, photoKey, photoFile.mimetype);

    // tmp files no longer needed
    await safeUnlink(proposalFile.path, photoFile.path);

    const service = await serviceUpdateTitle(id, user, {
      title: parseResult.data.title,
      desc: parseResult.data.desc,
      description: parseResult.data.description,
      proposal_url: publicUrlFromKey(uploadedProposalKey),
      photo_url: publicUrlFromKey(uploadedPhotoKey),
    });

    if (service.success === undefined) {
      await deleteS3Keys(uploadedProposalKey, uploadedPhotoKey);
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
    return;
  } catch {
    await safeUnlink(proposalFile.path, photoFile.path);
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const user = res.locals.user;

  if (user.is_admin !== true) {
    sendHttpError({ res, error: httpUnauthorizedError, message: "Admin only" });
    return;
  }

  try {
    const service = await serviceDeleteTitleById(id);
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
