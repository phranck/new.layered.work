import type { AdminRole, AdminUser } from "@layered/contracts";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { getUserBySession, SESSION_COOKIE_NAME } from "../services/auth-service";

export type AuthVariables = {
  user: AdminUser;
  userId: string;
  role: AdminRole;
  isOwner: boolean;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = await getUserBySession(getCookie(c, SESSION_COOKIE_NAME));

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  c.set("user", user);
  c.set("userId", user.id);
  c.set("role", user.role);
  c.set("isOwner", user.isOwner);

  await next();
});

export const requireOwner = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  if (!c.get("isOwner")) {
    return c.json({ message: "Forbidden" }, 403);
  }

  await next();
});
