import { Hono } from "hono";

import { ContentService } from "../services/content-service";

export function publicRoutes(contentService = new ContentService()) {
  const app = new Hono();

  app.get("/site", async (c) => c.json(await contentService.publicSiteData()));
  app.get("/health", (c) => c.json({ ok: true }));

  return app;
}
