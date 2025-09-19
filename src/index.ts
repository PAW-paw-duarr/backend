import fsPromises from "node:fs/promises";
import http from "node:http";
import mongoose from "mongoose";
import app from "~/app.js";
import { logger } from "~/lib/logger.js";
import env, { validateEnv } from "~/utils/env.js";
import { ConfigModel } from "./models/config.js";
import { TMP_DIR } from "./utils/constants.js";

async function main() {
  if (!validateEnv()) {
    process.exit(1);
  }

  await connectMongo();

  await fsPromises.mkdir(TMP_DIR, { recursive: true });

  await ConfigModel.getConfig(); // Ensure config document exists

  const server = http.createServer(app);

  server.listen(env.URL.port);
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
