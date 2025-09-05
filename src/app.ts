import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import createError, { type HttpError } from "http-errors";
import logger from "pino-http";

import indexRouter from "./routes/index";
import titleRouter from "./routes/title";

const app = express();

app.use(
  logger({
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      'res.headers["set-cookie"]',
    ],
    level: "info",
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        userAgent: req.headers["user-agent"],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
    base: {},
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/title", titleRouter);

// catch 404 and forward to error handler
app.use((next: NextFunction) => {
  next(createError(404, "Page not found!"));
});

// error handler
app.use((err: HttpError, _: Request, res: Response) => {
  res.status(err.status || 500);
  res.send(err.message);
});

export default app;
