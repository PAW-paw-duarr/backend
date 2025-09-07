import "express-serve-static-core";
import type { UserClass } from "~/models/users.js";

declare module "express-serve-static-core" {
  interface Locals {
    user: UserClass;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
