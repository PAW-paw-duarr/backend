import path from "node:path";
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import env from "~/utils/env.js";

const s3 = new S3Client({
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_API_KEY,
    secretAccessKey: env.S3_API_SECRET,
  },
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
});

function buildObjectKey(file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase();
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}

const allowedMime = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
    },
    key: (_, file, cb) => {
      cb(null, buildObjectKey(file));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp, .pdf files are allowed!"));
    }
  },
});
