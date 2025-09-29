import express from "express";
import { isFrontendExist } from "~/utils/frontend.js";

const router = express.Router();

const frontend = isFrontendExist();

if (frontend.exist) {
  router.use(express.static(frontend.clientPath));

  router.get("/{*any}", (_, res) => {
    res.sendFile(frontend.indexPath);
  });
} else {
  router.get("/{*any}", (_, res) => {
    res.send("Hello world!");
  });
}

export default router;
