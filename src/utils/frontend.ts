import fs from "node:fs";
import path from "node:path";

export function isFrontendExist() {
  const clientPath = path.join(process.cwd(), "build", "client");
  const indexPath = path.join(clientPath, "index.html");

  const clientDirExists = fs.existsSync(clientPath) && fs.statSync(clientPath).isDirectory();
  const indexExists = fs.existsSync(indexPath);

  const exist = clientDirExists && indexExists;

  return { exist, clientPath, indexPath };
}
