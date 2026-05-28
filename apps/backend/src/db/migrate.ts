import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { readEnv } from "../config/env";

async function main() {
  const client = postgres(readEnv().databaseUrl, { max: 1 });
  const database = drizzle(client);
  await migrate(database, { migrationsFolder: resolveMigrationsFolder() });
  await client.end();
  console.log("drizzle migrations applied");
}

function resolveMigrationsFolder(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), "apps/backend/drizzle"),
    resolve(process.cwd(), "drizzle"),
    resolve(currentDir, "drizzle"),
    resolve(currentDir, "../drizzle"),
  ];

  for (const candidate of candidates) {
    if (existsSync(resolve(candidate, "meta/_journal.json"))) {
      return candidate;
    }
  }

  throw new Error(`Drizzle migrations folder not found. Checked: ${candidates.join(", ")}`);
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
