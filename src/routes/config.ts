import express from "express";
import { ConfigModel } from "~/models/config.js";

const router = express.Router();

router.get("/period", async (_, res) => {
  const config = await ConfigModel.getConfig();

  res.status(200).json({ current_period: config.current_period });
});

export default router;
