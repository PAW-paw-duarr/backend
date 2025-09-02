import http from "node:http";
import mongoose from "mongoose";
import app from "./app";
import { logger } from "./lib/logger";
import env, { validateEnv } from "./utils/env";

async function main() {
  if (!validateEnv()) {
    process.exit(1);
  }

  await connectMongo();

  const server = http.createServer(app);

  server.listen(process.env.PORT || 3000);
  server.on("listening", () => onListening(server));
  server.on("error", (err) => {
    logger.error(err);
  });
}

function onListening(server: http.Server) {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  logger.info(`Listening on ${bind}`);
}

async function connectMongo() {
  try {
    await mongoose.connect(env.MONGO_URL);
  } catch (error) {
    logger.error(error, "Failed to connect to MongoDB");
    process.exit(1);
  }
}

main();
