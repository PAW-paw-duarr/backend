import express from "express";

const router = express.Router();

router.get("/whoami", async (req, res) => {
  res.json({ ...req.session.user });
  return;
});

export default router;
