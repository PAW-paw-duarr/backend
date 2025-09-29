import express from "express";
import { authMiddleware, sessionMiddleware } from "~/lib/auth.js";
import { httpLogger } from "~/lib/logger.js";
import authRouter from "~/routes/auth.js";
import fileRouter from "~/routes/file.js";
import indexRouter from "~/routes/index.js";
import submissionRouter from "~/routes/submission.js";
import teamRouter from "~/routes/team.js";
import titleRouter from "~/routes/title.js";
import userRouter from "~/routes/user.js";
import { httpInternalServerError, httpNotFoundError, sendHttpError } from "~/utils/httpError.js";
import { isFrontendExist } from "./utils/frontend.js";

const app = express();
const frontend = isFrontendExist();

// Global middleware
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);
if (frontend.exist) {
  app.use(express.static(frontend.clientPath));
}

// Public routes
app.use("/", indexRouter);

// API routes
const apiRouter = express.Router();

// Public API routes
apiRouter.use("/auth", authRouter);

// Protected API routes
const protectedApiRouter = express.Router();
protectedApiRouter.use(authMiddleware);
protectedApiRouter.use("/title", titleRouter);
protectedApiRouter.use("/submission", submissionRouter);
protectedApiRouter.use("/team", teamRouter);
protectedApiRouter.use("/user", userRouter);

apiRouter.use("/", protectedApiRouter);
app.use("/api", apiRouter);

// Protected file routes (non-API)
const fileRoutes = express.Router();
fileRoutes.use(authMiddleware);
fileRoutes.use("/file", fileRouter);
app.use("/", fileRoutes);

// catch 404 and forward to error handler
app.use((_, res) => {
  return sendHttpError({ res, error: httpNotFoundError, message: "Not Found" });
});

// error handler
app.use((_, res) => {
  return sendHttpError({ res, error: httpInternalServerError });
});

export default app;
