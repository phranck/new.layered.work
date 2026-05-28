import { scrypt as nodeScrypt, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type {
  AdminRole,
  AdminUser,
  LoginInput,
  SetupInput,
  UserMutation,
  UserUpdate,
} from "@layered/contracts";
import { and, asc, eq, gt, isNotNull, or } from "drizzle-orm";

import { db } from "../db/client";
import { sessions, users } from "../db/schema";

const scrypt = promisify(nodeScrypt);
const PASSWORD_KEY_LENGTH = 64;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const SESSION_COOKIE_NAME = "session";
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict" as const,
  maxAge: SESSION_DURATION_MS / 1000,
  path: "/",
};

type UserRow = typeof users.$inferSelect;

function toAdminUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    login: row.login,
    displayName: row.displayName,
    role: row.role,
    isOwner: row.role === "owner",
    locale: row.locale,
    avatarUrl: row.avatarUrl,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return sessionId;
}

export async function getSetupState() {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(isNotNull(users.passwordHash))
    .limit(1);
  return { needsSetup: rows.length === 0 };
}

export async function setupOwner(
  input: SetupInput,
): Promise<{ sessionId: string; user: AdminUser }> {
  const state = await getSetupState();
  if (!state.needsSetup) {
    throw new Error("Setup already completed");
  }

  const passwordHash = await hashPassword(input.password);

  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(users).orderBy(asc(users.createdAt)).limit(1);
    const now = new Date();
    const userId = existing?.id ?? `user_${randomUUID()}`;

    const [row] = existing
      ? await tx
          .update(users)
          .set({
            email: input.email,
            login: input.login,
            displayName: input.displayName,
            role: "owner",
            locale: "de",
            passwordHash,
            updatedAt: now,
          })
          .where(eq(users.id, existing.id))
          .returning()
      : await tx
          .insert(users)
          .values({
            id: userId,
            email: input.email,
            login: input.login,
            displayName: input.displayName,
            role: "owner",
            locale: "de",
            passwordHash,
          })
          .returning();

    const sessionId = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await tx.insert(sessions).values({ id: sessionId, userId: row.id, expiresAt });
    await tx.update(users).set({ lastLoginAt: now, updatedAt: now }).where(eq(users.id, row.id));

    return { sessionId, user: toAdminUser({ ...row, lastLoginAt: now, updatedAt: now }) };
  });
}

export async function login(input: LoginInput): Promise<{ sessionId: string; user: AdminUser }> {
  const [row] = await db
    .select()
    .from(users)
    .where(or(eq(users.login, input.login), eq(users.email, input.login)))
    .limit(1);

  if (!row?.passwordHash || !(await verifyPassword(input.password, row.passwordHash))) {
    throw new Error("Invalid credentials");
  }

  const sessionId = await createSession(row.id);
  return {
    sessionId,
    user: toAdminUser({ ...row, lastLoginAt: new Date(), updatedAt: new Date() }),
  };
}

export async function logout(sessionId: string | undefined): Promise<void> {
  if (!sessionId) return;
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function getUserBySession(sessionId: string | undefined): Promise<AdminUser | null> {
  if (!sessionId) return null;

  const now = new Date();
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1);

  return row ? toAdminUser(row.user) : null;
}

export async function listManagedUsers(): Promise<AdminUser[]> {
  const rows = await db.select().from(users).orderBy(asc(users.createdAt));
  return rows.map(toAdminUser);
}

export async function createManagedUser(input: UserMutation): Promise<AdminUser> {
  if (input.role === "owner") {
    throw new Error("Owner role cannot be created from user management");
  }

  const [row] = await db
    .insert(users)
    .values({
      id: `user_${randomUUID()}`,
      email: input.email,
      login: input.login,
      displayName: input.displayName,
      role: input.role,
      locale: input.locale,
      passwordHash: input.password ? await hashPassword(input.password) : null,
    })
    .returning();

  return toAdminUser(row);
}

export async function updateManagedUser(
  id: string,
  input: UserUpdate,
  actor: AdminUser,
): Promise<AdminUser> {
  if (!actor.isOwner && actor.id !== id) {
    throw new Error("Forbidden");
  }

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (input.email !== undefined) updates.email = input.email;
  if (input.login !== undefined) updates.login = input.login;
  if (input.displayName !== undefined) updates.displayName = input.displayName;
  if (input.locale !== undefined) updates.locale = input.locale;
  if (input.password !== undefined && input.password !== "")
    updates.passwordHash = await hashPassword(input.password);

  if (input.role !== undefined) {
    if (!actor.isOwner || id === actor.id || input.role === "owner") {
      throw new Error("Forbidden");
    }
    updates.role = input.role as AdminRole;
  }

  const [row] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  if (!row) throw new Error("User not found");

  return toAdminUser(row);
}

export async function deleteManagedUser(id: string, actor: AdminUser): Promise<void> {
  if (!actor.isOwner || actor.id === id) {
    throw new Error("Forbidden");
  }

  await db.delete(users).where(eq(users.id, id));
}
