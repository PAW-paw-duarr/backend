import "express-serve-static-core";
import type { UserDocument } from "~/models/users.js";

declare module "express-serve-static-core" {
  interface Locals {
    user?: UserDocument;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
