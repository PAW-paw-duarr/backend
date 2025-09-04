import express from "express";
import { z } from "zod";
import { serviceSigninPassword, serviceSignupPassword } from "~/services/authService";
import { httpBadRequestError, httpInternalServerError, sendHttpError } from "~/utils/httpError";

const router = express.Router();

const passwordSignInSchema = z.object({
  email: z.email(),
  password: z.string(),
});
router.post("/signin/password", async (req, res) => {
  const { email, password } = req.body;

  const parseResult = passwordSignInSchema.safeParse({ email, password });
  if (!parseResult.success) {
    sendHttpError({ res, error: httpBadRequestError, detail: z.treeifyError(parseResult.error) });
    return;
  }

  const resp = await serviceSigninPassword({ email, password });

  if (resp.success === undefined) {
    sendHttpError({ res, error: resp.error, message: resp.data });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      sendHttpError({ res, error: httpInternalServerError });
      return;
    }
    req.session.user = resp.data;
    req.session.save((err) => {
      if (err) {
        sendHttpError({ res, error: httpInternalServerError });
        return;
      }
      res.json(resp.data);
      return;
    });
  });
});

const passwordSignUpSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(1),
});
router.post("/signup/password", async (req, res) => {
  const { email, password, name } = req.body;
  const parseResult = passwordSignUpSchema.safeParse({ email, password, name });
  if (!parseResult.success) {
    sendHttpError({ res, error: httpBadRequestError, detail: z.treeifyError(parseResult.error) });
    return;
  }

  const resp = await serviceSignupPassword({ email, password, name });

  if (resp.success === undefined) {
    sendHttpError({ res, error: resp.error, message: resp.data });
    return;
  }
  res.status(201).json(resp.data);
  return;
});

router.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      sendHttpError({ res, error: httpInternalServerError });
      return;
    }
    res.clearCookie("sess");
    res.json({ message: "Signed out successfully" });
    return;
  });
});

export default router;
