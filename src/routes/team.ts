import express from "express";
import z from "zod";
import {
  serviceGetTeamById,
  serviceJoinTeam,
  serviceKickMemberTeam,
} from "~/services/teamService.js";
import { httpBadRequestError, sendHttpError } from "~/utils/httpHelper.js";

const router = express.Router();

router.get("/", async (_, res) => {
  const user = res.locals.user;

  const service = await serviceGetTeamById(user.team?.id);
  if (service.success === undefined) {
    sendHttpError({ res, error: service.error, message: service.data });
    return;
  }

  res.status(service.success).json(service.data);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const service = await serviceGetTeamById(id);
  if (service.success === undefined) {
    sendHttpError({ res, error: service.error, message: service.data });
    return;
  }

  res;
});

const postJoinSchema = z.object({
  code: z.string(),
});
router.post("/join", async (req, res) => {
  const { code } = req.body;
  const parseResult = postJoinSchema.safeParse({ code });
  if (!parseResult.success) {
    sendHttpError({ res, error: httpBadRequestError, detail: z.treeifyError(parseResult.error) });
    return;
  }

  const user = res.locals.user;

  const service = await serviceJoinTeam(code, user);
  if (service.success === undefined) {
    sendHttpError({ res, error: service.error, message: service.data });
    return;
  }

  res.status(service.success).json(service.data);
});

const deleteKickSchema = z.object({
  user_id: z.string(),
});
router.delete("/kick", async (req, res) => {
  const { user_id } = req.body;
  const parseResult = deleteKickSchema.safeParse({ user_id });
  if (!parseResult.success) {
    sendHttpError({ res, error: httpBadRequestError, detail: z.treeifyError(parseResult.error) });
    return;
  }

  const user = res.locals.user;

  const service = await serviceKickMemberTeam(user_id, user);
  if (service.success === undefined) {
    sendHttpError({ res, error: service.error, message: service.data });
    return;
  }

  res.status(service.success);
});

export default router;
