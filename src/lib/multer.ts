import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { TMP_DIR } from "~/utils/constants.js";

function tmpFilename(originalname: string) {
  const ext = path.extname(originalname).toLowerCase();
  return `${Date.now()}_${crypto.randomUUID()}${ext}`;
}

const allowedMime = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export const uploadTmp = multer({
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (_, file, cb) => cb(null, tmpFilename(file.originalname)),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 2, fields: 20 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) cb(null, true);
    else cb(new Error("Only .jpg, .jpeg, .png, .webp, .pdf files are allowed!"));
  },
});
