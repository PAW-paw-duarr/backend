import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./src/test/setup.ts",
    isolate: true,
    include: ["src/test/**/*.test.ts"],
    env: loadEnv(mode, process.cwd(), ""),
  },
}));
