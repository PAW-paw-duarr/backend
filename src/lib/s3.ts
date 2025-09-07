import fs from "node:fs";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import env from "~/utils/env.js";

export const s3 = new S3Client({
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_API_KEY,
    secretAccessKey: env.S3_API_SECRET,
  },
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
});

export function publicUrlFromKey(key: string): string {
  return `${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${key}`;
}

export async function putFromDisk(localPath: string, key: string, contentType?: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(localPath),
      ContentType: contentType,
    }),
  );
  return key;
}

export async function deleteS3Keys(...keys: string[]) {
  const Objects = keys.filter(Boolean).map((Key) => ({ Key }));
  if (!Objects.length) return;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET_NAME,
      Delete: { Objects, Quiet: true },
    }),
  );
}
