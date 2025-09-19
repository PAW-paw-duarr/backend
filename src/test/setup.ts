import { afterAll, beforeAll, vi } from "vitest";
import { logger } from "~/lib/logger.js";
import * as db from "./database/helper.js";

beforeAll(async () => {
  await db.connect();
  vi.spyOn(logger, "info").mockImplementation(() => undefined);
  vi.spyOn(logger, "error").mockImplementation(() => undefined);
  vi.spyOn(logger, "warn").mockImplementation(() => undefined);
});

afterAll(async () => {
  await db.closeDatabase();
});
