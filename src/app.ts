import express from "express";
import { httpLogger } from "~/lib/logger.js";
import { authMiddleware, sessionMiddleware } from "~/lib/auth.js";
import authRouter from "~/routes/auth.js";
import indexRouter from "~/routes/index.js";
import titleRouter from "~/routes/title.js";
import { httpInternalServerError, httpNotFoundError, sendHttpError } from "~/utils/httpError.js";

const app = express();

app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);

const apiRoute = express.Router();
app.use("/api", apiRoute);
apiRoute.use("/", indexRouter);
apiRoute.use("/auth", authRouter);

const protectedRoute = express.Router();
protectedRoute.use(authMiddleware);
protectedRoute.use("/title", titleRouter);

apiRoute.use(protectedRoute);

// catch 404 and forward to error handler
app.use((_, res) => {
  return sendHttpError({ res, error: httpNotFoundError, message: "Not Found" });
});

// error handler
app.use((_, res) => {
  return sendHttpError({ res, error: httpInternalServerError });
});

export default app;
