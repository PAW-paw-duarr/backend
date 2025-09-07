import { z } from "zod";
import { logger } from "~/lib/logger.js";

const envSchema = z.object({
  IS_PROD: z.boolean(),

  MONGO_URL: z.url("Invalid MongoDB URL format"),

  DOMAIN: z.url("DOMAIN must be a valid URL"),
  URL: z.object({
    protocol: z.string(),
    hostname: z.string(),
    port: z.string(),
    baseUrl: z.url(),
  }),

  SECRET_KEY: z.string().min(32, "SECRET_KEY must be at least 32 characters long"),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  S3_API_KEY: z.string(),
  S3_API_SECRET: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_REGION: z.string(),
  S3_ENDPOINT: z.url(),
});

const env: z.infer<typeof envSchema> = envSchema.parse({
  IS_PROD: process.env.NODE_ENV === "production",

  MONGO_URL: process.env.MONGO_URL,
  DOMAIN: process.env.DOMAIN,
  URL: parseUrl(process.env.DOMAIN || ""),

  SECRET_KEY: process.env.SECRET_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  S3_API_KEY: process.env.S3_API_KEY,
  S3_API_SECRET: process.env.S3_API_SECRET,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_REGION: process.env.S3_REGION,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
});

export function validateEnv(): boolean {
  try {
    envSchema.parse(env);
    return true;
  } catch (error) {
    logger.error("Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.core.$ZodIssue) => {
        logger.error(`  • ${err.path.join(".")}: ${err.message}`);
      });
    }
    return false;
  }
}

function parseUrl(urlString: string) {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("DOMAIN must be a valid URL");
  }

  let port = url.port;
  if (!port) {
    if (url.protocol === "http:") port = "80";
    if (url.protocol === "https:") port = "443";
  }

  return {
    protocol: url.protocol.replace(":", ""),
    hostname: url.hostname,
    port,
    baseUrl: url.origin,
  };
}

export default env;
