import pino from "pino";
import httpPino from "pino-http";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
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

export const httpLogger = httpPino.default({
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.body.password",
    'res.headers["set-cookie"]',
  ],
  level: process.env.LOG_LEVEL || "info",
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
