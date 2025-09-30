import express from "express";
import { logger } from "~/lib/logger.js";
import { getS3Object } from "~/lib/s3.js";
import { httpInternalServerError, httpNotFoundError, sendHttpError } from "~/utils/httpError.js";

const router = express.Router();

router.get("/{*any}", async (req, res) => {
  try {
    const key = req.path.substring(1);

    if (!key) {
      return sendHttpError({ res, error: httpNotFoundError, message: "File not found" });
    }

    const s3Response = await getS3Object(key);

    if (s3Response.ContentType) {
      res.setHeader("Content-Type", s3Response.ContentType);
    }
    if (s3Response.ContentLength) {
      res.setHeader("Content-Length", s3Response.ContentLength);
    }
    if (s3Response.ETag) {
      res.setHeader("ETag", s3Response.ETag);
    }

    const stream = s3Response.Body as NodeJS.ReadableStream;
    stream.pipe(res);
    return;
  } catch (error) {
    const err = error as Error;
    if (err.name === "NoSuchKey") {
      sendHttpError({ res, error: httpNotFoundError, message: "File not found" });
    } else {
      logger.error(err, "Error getting file from S3");
      sendHttpError({ res, error: httpInternalServerError });
    }
    return;
  }
});

export default router;
