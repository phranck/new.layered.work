import {
  contentCreateSchema,
  contentMetaSchema,
  contentMutationSchema,
  contentUpdateSchema,
  loginSchema,
  type NavId,
  navItemsSchema,
  setupSchema,
  siteSettingsSchema,
  userMutationSchema,
  userUpdateSchema,
} from "@layered/contracts";
import { type Context, Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { ZodType } from "zod";

import { type AuthVariables, requireAuth, requireOwner } from "../middleware/auth";
import { getManagedNavItems, replaceManagedNavItems } from "../services/admin-nav";
import {
  createManagedUser,
  deleteManagedUser,
  getSetupState,
  listManagedUsers,
  login,
  logout,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  setupOwner,
  updateManagedUser,
} from "../services/auth-service";
import { ContentService } from "../services/content-service";
import {
  createManagedContentPage,
  deleteManagedContentPage,
  getManagedContentPage,
  listManagedContentPages,
  patchManagedContentPage,
  saveManagedContentPage,
} from "../services/page-service";

async function parseBody<T>(c: Context, schema: ZodType<T>) {
  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export function adminRoutes(contentService = new ContentService()) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.get("/setup", async (c) => c.json(await getSetupState()));

  app.post("/setup", async (c) => {
    const payload = await parseBody(c, setupSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      const result = await setupOwner(payload);
      setCookie(c, SESSION_COOKIE_NAME, result.sessionId, SESSION_COOKIE_OPTIONS);
      return c.json(result.user, 201);
    } catch (error) {
      return c.json({ message: error instanceof Error ? error.message : "Setup failed" }, 403);
    }
  });

  app.post("/login", async (c) => {
    const payload = await parseBody(c, loginSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      const result = await login(payload);
      setCookie(c, SESSION_COOKIE_NAME, result.sessionId, SESSION_COOKIE_OPTIONS);
      return c.json(result.user);
    } catch {
      return c.json({ message: "Invalid credentials" }, 401);
    }
  });

  app.post("/logout", requireAuth, async (c) => {
    await logout(getCookie(c, SESSION_COOKIE_NAME));
    deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
    return c.json({ ok: true });
  });

  app.get("/me", requireAuth, async (c) => c.json(c.get("user")));

  app.get("/users", requireAuth, async (c) => c.json(await listManagedUsers()));

  app.post("/users", requireAuth, requireOwner, async (c) => {
    const payload = await parseBody(c, userMutationSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      return c.json(await createManagedUser(payload), 201);
    } catch (error) {
      return c.json(
        { message: error instanceof Error ? error.message : "User creation failed" },
        400,
      );
    }
  });

  app.patch("/users/:id", requireAuth, async (c) => {
    const payload = await parseBody(c, userUpdateSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      return c.json(await updateManagedUser(c.req.param("id"), payload, c.get("user")));
    } catch (error) {
      const message = error instanceof Error ? error.message : "User update failed";
      return c.json(
        { message },
        message === "Forbidden" ? 403 : message === "User not found" ? 404 : 400,
      );
    }
  });

  app.delete("/users/:id", requireAuth, requireOwner, async (c) => {
    try {
      await deleteManagedUser(c.req.param("id"), c.get("user"));
      return c.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "User deletion failed";
      return c.json({ message }, message === "Forbidden" ? 403 : 400);
    }
  });

  app.get("/site-content", requireAuth, async (c) => {
    const [settings, projects, posts, topics] = await Promise.all([
      contentService.settings(),
      contentService.projects(),
      contentService.posts(),
      contentService.topics(),
    ]);
    return c.json({ settings, projects, posts, topics });
  });

  app.get("/content", requireAuth, async (c) => c.json(await listManagedContentPages()));

  app.post("/content", requireAuth, async (c) => {
    const payload = await parseBody(c, contentCreateSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      return c.json(await createManagedContentPage({ ...payload, userId: c.get("userId") }), 201);
    } catch (error) {
      return contentPageError(c, error, "Content page creation failed");
    }
  });

  app.get("/content/:slug", requireAuth, async (c) => {
    try {
      return c.json(await getManagedContentPage(c.req.param("slug")));
    } catch (error) {
      return contentPageError(c, error, "Content page load failed");
    }
  });

  app.put("/content/:slug", requireAuth, async (c) => {
    const payload = await parseBody(c, contentUpdateSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      return c.json(
        await saveManagedContentPage(c.req.param("slug"), payload.content, c.get("userId")),
      );
    } catch (error) {
      return contentPageError(c, error, "Content page save failed");
    }
  });

  app.patch("/content/:slug", requireAuth, async (c) => {
    const payload = await parseBody(c, contentMetaSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    try {
      return c.json(await patchManagedContentPage(c.req.param("slug"), payload, c.get("userId")));
    } catch (error) {
      return contentPageError(c, error, "Content page update failed");
    }
  });

  app.delete("/content/:slug", requireAuth, async (c) => {
    try {
      await deleteManagedContentPage(c.req.param("slug"));
      return c.json({ message: "Content page deleted" });
    } catch (error) {
      return contentPageError(c, error, "Content page deletion failed");
    }
  });

  app.get("/nav/:navId", requireAuth, async (c) => {
    const navId = parseNavId(c.req.param("navId"));
    if (!navId) return c.json({ message: "Invalid navId" }, 400);

    return c.json(await getManagedNavItems(navId));
  });

  app.put("/nav/:navId", requireAuth, async (c) => {
    const navId = parseNavId(c.req.param("navId"));
    if (!navId) return c.json({ message: "Invalid navId" }, 400);

    const payload = await parseBody(c, navItemsSchema);
    if (!payload) return c.json({ message: "Validation failed" }, 400);

    return c.json(
      await replaceManagedNavItems(
        navId,
        payload.items.map((item) => ({
          pageSlug: item.pageSlug ?? null,
          url: item.url ?? null,
          target: item.target,
          label: item.label ?? null,
        })),
      ),
    );
  });

  app.put("/settings", requireAuth, async (c) => {
    const payload = siteSettingsSchema.parse(await c.req.json());
    return c.json(await contentService.saveSettings(payload));
  });

  app.post("/projects", requireAuth, async (c) => {
    const payload = contentMutationSchema.parse(await c.req.json());
    return c.json(await contentService.upsertProject(payload));
  });

  app.post("/posts", requireAuth, async (c) => {
    const payload = contentMutationSchema.parse(await c.req.json());
    return c.json(await contentService.upsertPost(payload));
  });

  app.post("/seed", requireAuth, async (c) => {
    await contentService.seedDefaults();
    return c.json({ ok: true });
  });

  return app;
}

function parseNavId(navId: string): NavId | null {
  if (navId === "header" || navId === "footer") return navId;
  return null;
}

function contentPageError(c: Context, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message === "Content page not found") {
    return c.json({ message }, 404);
  }
  if (message === "Slug already exists") {
    return c.json({ message }, 409);
  }
  return c.json({ message }, 400);
}
