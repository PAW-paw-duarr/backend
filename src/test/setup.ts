import { afterAll, beforeAll, vi } from "vitest";
import { logger } from "~/lib/logger.js";
import * as db from "./database/helper.js";

beforeAll(async () => {
  await db.connect();
  vi.spyOn(logger, "info").mockImplementation(() => undefined);
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  vi.spyOn(logger, "warn").mockImplementation(() => undefined);

  vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
    return {
      ...actual,
      S3Client: vi.fn(),
    };
  });
});

afterAll(async () => {
  await db.closeDatabase();
});
