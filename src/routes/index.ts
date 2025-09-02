import type { Response } from "express";
import express from "express";

const router = express.Router();

router.get("/", async (_, res: Response) => {
  res.send("Hello from the index route!");
});

export default router;
