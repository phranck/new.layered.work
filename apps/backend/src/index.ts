import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { readEnv } from "./config/env";
import { sql } from "./db/client";
import { adminRoutes } from "./routes/admin";
import { publicRoutes } from "./routes/public";

const env = readEnv();
const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      return env.allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.route("/api", publicRoutes());
app.route("/api/admin", adminRoutes());

app.get("/", (c) => c.redirect("/api/health"));

serve(
  {
    fetch: app.fetch,
    port: env.port,
    hostname: process.env.HOST ?? "::",
  },
  (info) => {
    console.log(`layered backend listening on ${info.address}:${info.port}`);
  },
);

process.on("SIGTERM", async () => {
  await sql.end();
  process.exit(0);
});
