import { afterAll, afterEach, beforeAll } from "vitest";

import * as db from "./database/helper.js";

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});
