import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/db/migrate.ts", "src/scripts/seed.ts"],
  format: ["esm"],
  target: "node24",
  platform: "node",
  bundle: true,
  noExternal: [/^(?!node:).*/],
  outDir: "dist",
  clean: true,
  esbuildOptions(options) {
    options.nodePaths = [path.resolve(__dirname, "node_modules")];
  },
});
