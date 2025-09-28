import express from "express";
import z from "zod";
import {
  serviceAdminCreateTeams,
  serviceAdminDeleteTeamById,
  serviceAdminGetAllTeams,
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
  const currentUser = res.locals.user;

  if (!currentUser.is_admin) {
    sendHttpError({
      res,
      error: httpBadRequestError,
      message: "Unauthorized",
    });
    return;
  }

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
    const service = await serviceGetTeamById(id, currentUser);

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
    const service = await serviceJoinTeam(parseResult.data.code, user);
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

router.delete("/kick/:id", async (req, res) => {
  const user = res.locals.user;
  const id = req.params.id;

  try {
    const service = await serviceKickMemberTeam(id, user);
    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).send();
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
      message: "Unauthorized",
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
      message: "Unauthorized",
    });
    return;
  }

  try {
    const service = await serviceAdminDeleteTeamById(title_id);

    if (service.success === undefined) {
      sendHttpError({ res, error: service.error, message: service.data });
      return;
    }

    res.status(service.success).send();
    return;
  } catch {
    sendHttpError({ res, error: httpInternalServerError });
    return;
  }
});

export default router;
