import app from "./app";
import http from "http";
import { logger } from "./lib/logger";

const server = http.createServer(app);

server.listen(process.env.PORT || 3000);
server.on("listening", onListening);
server.on("error", (err) => {
  logger.error(err);
});

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  logger.info(`Listening on ${bind}`);
}
