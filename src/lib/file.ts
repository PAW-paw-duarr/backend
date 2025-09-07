import fsp from "node:fs/promises";

export async function safeUnlink(...paths: Array<string>) {
  await Promise.all(paths.filter(Boolean).map((p) => fsp.unlink(p).catch(() => {})));
}
