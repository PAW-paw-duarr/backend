import pino from "pino";
import httpPino from "pino-http";
import { isProd } from "~/utils/constants";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    bindings: () => {
      return {};
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = httpPino({
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
});
