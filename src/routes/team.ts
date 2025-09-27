import express from "express";
import z from "zod";
import {
  serviceAdminCreateTeams,
  serviceAdminGetAllTeams,
  serviceAdminGetTeamById,
  serviceGetTeamById,
  serviceJoinTeam,
  serviceKickMemberTeam,
} from "~/services/teamService.js";
import { CategoryCapstone } from "~/utils/constants.js";
import {
  httpBadRequestError,
  httpInternalServerError,
  httpUnauthorizedError,
  sendHttpError,
} from "~/utils/httpError.js";

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const service = await serviceAdminGetAllTeams();

    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const currentUser = res.locals.user;

  try {
    const service = currentUser.is_admin
      ? await serviceAdminGetTeamById(id)
      : await serviceGetTeamById(currentUser.team?._id.toString() || "");

    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
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

  try {
    const service = await serviceJoinTeam(code, user);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).json(service.data);
    return;
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
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

  try {
    const service = await serviceKickMemberTeam(parseResult.data.user_id, user);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success);
    return;
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

const newPeriodSchema = z.object({
  team_data: z.array(
    z.object({
      name: z.string(),
      leader_email: z.email(),
      category: z.enum(CategoryCapstone),
    }),
  ),
  new_period: z.boolean().optional(),
});
router.post("/new", async (req, res) => {
  const { team_data, new_period } = req.body;
  const currentUser = res.locals.user;

  if (!currentUser.is_admin) {
    sendHttpError({
      res,
      error: httpUnauthorizedError,
      message: "Admin privilege required",
    });
    return;
  }

  const parseResult = newPeriodSchema.safeParse({ team_data, new_period });
  if (!parseResult.success) {
    sendHttpError({ res, error: httpBadRequestError, detail: z.treeifyError(parseResult.error) });
    return;
  }

  try {
    const service = await serviceAdminCreateTeams(
      parseResult.data.team_data,
      parseResult.data.new_period,
    );

    res.status(service.success).json(service.data);
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

router.delete("/:id", async (req, res) => {
  const title_id = req.params.id;
  const currentUser = res.locals.user;

  if (!currentUser.is_admin) {
    sendHttpError({
      res,
      error: httpBadRequestError,
      message: "Admin privilege required",
    });
    return;
  }

  try {
    const service = await serviceAdminGetTeamById(title_id);

    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success);
    return;
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export default router;
