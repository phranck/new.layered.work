import { sql } from "../db/client";
import { ContentService } from "../services/content-service";

async function main() {
  await new ContentService().seedDefaults();
  console.log("seeded layered.work defaults");
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
