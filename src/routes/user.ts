import crypto from "node:crypto";
import path from "node:path";
import express from "express";
import z from "zod";
import { safeUnlink } from "~/lib/file.js";
import { logger } from "~/lib/logger.js";
import { uploadTmp } from "~/lib/multer.js";
import { deleteS3Keys, publicUrlFromKey, putFromDisk } from "~/lib/s3.js";
import {
  serviceAdminGetAllUsers,
  serviceDeleteUserById,
  serviceGetUserById,
  serviceUpdateUser,
} from "~/services/userService.js";
import {
  httpBadRequestError,
  httpInternalServerError,
  httpUnauthorizedError,
  sendHttpError,
} from "~/utils/httpError.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const currentUser = res.locals.user;

  if (!currentUser.is_admin) {
    sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
    return;
  }

  const service = await serviceAdminGetAllUsers();
  if (service.success === undefined) {
    sendHttpError({ res, error: service.error, message: service.data });
    return;
  }

  res.status(service.success).json(service.data);
  return;
});

router.get("/me", async (_, res) => {
  const user = res.locals.user;

  try {
    const service = await serviceGetUserById(user.id);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
    return;
  } catch (error) {
    const err = error as Error;
    logger.error(err);
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
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
  } catch (error) {
    const err = error as Error;
    logger.error(err);
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
const uploadCvFile = uploadTmp.fields([{ name: "cv_file", maxCount: 1 }]);

router.patch("/", uploadCvFile, async (req, res) => {
  const user = res.locals.user;
  const { name, email, password } = req.body;
  const files = req.files as Record<string, Express.Multer.File[]>;
  const cvFile = files?.cv_file?.[0];

  const parseResult = updateUserSchema.safeParse({ name, email, password });
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

  if (cvFile) {
    if (cvFile.mimetype !== "application/pdf") {
      await safeUnlink(cvFile.path);
      sendHttpError({ res, error: httpBadRequestError, message: "Invalid file types" });
      return;
    }

    const uid = crypto.randomUUID();
    const proposalKey = `cv/${uid}-${path.extname(cvFile.originalname).toLowerCase()}`;

    try {
      const uploadCvKey = await putFromDisk(cvFile.path, proposalKey, cvFile.mimetype);
      await safeUnlink(cvFile.path);

      const service = await serviceUpdateUser(user, {
        ...parseResult.data,
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
  } else {
    // Update tanpa CV
    const service = await serviceUpdateUser(user, parseResult.data);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
    return;
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const user = res.locals.user;
  if (!user.is_admin) {
    sendHttpError({ res, error: httpUnauthorizedError, message: "Unauthorized" });
    return;
  }

  if (user.id === id) {
    sendHttpError({ res, error: httpBadRequestError, message: "You cannot delete yourself" });
    return;
  }

  try {
    const service = await serviceDeleteUserById(id);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).send();
    return;
  } catch (error) {
    const err = error as Error;
    logger.error(err);
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export default router;
