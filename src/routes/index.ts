import express from "express";
import { isFrontendExist } from "~/utils/frontend.js";

const router = express.Router();

router.get("/*", async (_, res) => {
  const frontend = isFrontendExist();

  if (frontend.exist) {
    res.sendFile(frontend.indexPath);
  } else {
    res.send("Hello world!");
  }
});

export default router;
