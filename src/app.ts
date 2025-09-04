import express from "express";
import { httpLogger } from "~/lib/logger";
import { authMiddleware, sessionMiddleware } from "./lib/auth";
import authRouter from "./routes/auth";
import indexRouter from "./routes/index";
import protectedRouter from "./routes/protected";
import titleRouter from "./routes/title";
import { httpInternalServerError, httpNotFoundError, sendHttpError } from "./utils/httpError";

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
protectedRoute.use("/", protectedRouter);
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
