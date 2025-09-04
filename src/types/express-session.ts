import type { components } from "~/lib/api/schema";

declare module "express-session" {
  interface SessionData {
    user?: components["schemas"]["data-user"];
  }
}
