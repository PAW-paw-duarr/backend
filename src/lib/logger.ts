import pino from "pino";

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
        bindings: () => {
            return {
            };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});