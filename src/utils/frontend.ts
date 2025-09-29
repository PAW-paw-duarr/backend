import fs from "node:fs";
import path from "node:path";

export function isFrontendExist() {
  const clientPath = path.join(process.cwd(), "build", "client");
  const indexPath = path.join(clientPath, "index.html");
  const exist = fs.existsSync(clientPath) && fs.existsSync(indexPath);

  return { exist, clientPath, indexPath };
}
