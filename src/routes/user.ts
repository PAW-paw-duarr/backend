import path from "node:path";
import express from "express";
import z from "zod";
import { safeUnlink } from "~/lib/file.js";
import { uploadTmp } from "~/lib/multer.js";
import { deleteS3Keys, publicUrlFromKey, putFromDisk } from "~/lib/s3.js";
import { serviceGetUserById, serviceUpdateUser } from "~/services/userService.js";
import { httpBadRequestError, httpInternalServerError, sendHttpError } from "~/utils/httpError.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const user = res.locals.user;
  res.status(200).json(user);
  return;
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const service = await serviceGetUserById(id);
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

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .optional(),
});
const uploadUpdateTitle = uploadTmp.fields([{ name: "cv_file", maxCount: 1 }]);
router.patch("/", uploadUpdateTitle, async (req, res) => {
  const user = res.locals.user;
  const { title, desc, description } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;
  const cvFile = files?.cv_file?.[0];

  const parseResult = updateUserSchema.safeParse({ title, desc, description });
  if (!parseResult.success) {
    await safeUnlink(cvFile?.path);
    sendHttpError({
      res,
      error: httpBadRequestError,
      detail: z.treeifyError(parseResult.error),
    });
    return;
  }

  if (user.google_id !== undefined && parseResult.data.password) {
    await safeUnlink(cvFile?.path);
    sendHttpError({
      res,
      error: httpBadRequestError,
      message: "Cannot change password for Google authenticated users",
    });
    return;
  }

  if (cvFile.mimetype !== "application/pdf") {
    await safeUnlink(cvFile.path);
    sendHttpError({ res, error: httpBadRequestError, message: "Invalid file types" });
    return;
  }

  const uid = crypto.randomUUID();
  const proposalKey = `cv/${uid}-${path.extname(cvFile.originalname).toLowerCase()}`;

  try {
    // Upload from local tmp → S3
    const uploadCvKey = await putFromDisk(cvFile.path, proposalKey, cvFile.mimetype);

    // tmp files no longer needed
    await safeUnlink(cvFile.path);

    const service = await serviceUpdateUser(user, {
      name: parseResult.data.name,
      email: parseResult.data.email,
      password: parseResult.data.password,
      cv_url: publicUrlFromKey(uploadCvKey),
    });

    if (service.success === undefined) {
      await deleteS3Keys(uploadCvKey);
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
    return;
  } catch {
    await safeUnlink(cvFile.path);
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export default router;
