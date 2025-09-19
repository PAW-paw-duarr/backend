import { afterAll, beforeAll } from "vitest";

import * as db from "./database/helper.js";

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.closeDatabase();
});
