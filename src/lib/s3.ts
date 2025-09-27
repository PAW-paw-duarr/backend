import fs from "node:fs";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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
  return `${env.DOMAIN}/file/${key}`;
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

export async function getS3Object(key: string) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
  return response;
}

export function extractS3KeyFromUrl(url: string) {
  const match = url.match(/\/file\/(.*)$/);
  return match ? match[1] : null;
}
