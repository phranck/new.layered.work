import { randomUUID } from "node:crypto";

import type { NavId, NavItem, NavTarget } from "@layered/contracts";
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../db/client";
import { contentPages, navItems, navigations } from "../db/schema";

interface StoredNavTarget {
  pageSlug?: string | null;
  target?: NavTarget;
  type?: "page" | "url";
  url?: string | null;
}

interface StoredNavItemRow {
  id: string;
  label: string;
  position: number;
  target: unknown;
}

export interface ReplaceAdminNavItemInput {
  pageSlug: string | null;
  url: string | null;
  target: NavTarget;
  label: string | null;
}

function navLabel(navId: NavId): string {
  return navId === "header" ? "Header navigation" : "Footer navigation";
}

function isStoredNavTarget(value: unknown): value is StoredNavTarget {
  return typeof value === "object" && value !== null;
}

function parseStoredTarget(value: unknown): Pick<NavItem, "pageSlug" | "target" | "url"> {
  if (!isStoredNavTarget(value)) {
    return { pageSlug: null, target: "_self", url: null };
  }

  return {
    pageSlug: typeof value.pageSlug === "string" ? value.pageSlug : null,
    target: value.target === "_blank" ? "_blank" : "_self",
    url: typeof value.url === "string" ? value.url : null,
  };
}

async function ensureNavigationId(navId: NavId): Promise<string> {
  const existing = await db
    .select({ id: navigations.id })
    .from(navigations)
    .where(eq(navigations.key, navId))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const id = `nav_${navId}`;
  await db
    .insert(navigations)
    .values({ id, key: navId, label: navLabel(navId) })
    .onConflictDoNothing({ target: navigations.key });

  const created = await db
    .select({ id: navigations.id })
    .from(navigations)
    .where(eq(navigations.key, navId))
    .limit(1);

  if (!created[0]) throw new Error(`Navigation ${navId} could not be initialized`);
  return created[0].id;
}

async function pageTitleMap(pageSlugs: string[]): Promise<Map<string, string>> {
  if (pageSlugs.length === 0) return new Map();

  const rows = await db
    .select({ slug: contentPages.slug, title: contentPages.title })
    .from(contentPages)
    .where(inArray(contentPages.slug, pageSlugs));

  return new Map(rows.map((row) => [row.slug, row.title]));
}

/**
 * Lists navigation items for one admin-managed navigation bucket.
 */
export async function getManagedNavItems(navId: NavId): Promise<NavItem[]> {
  const navigationId = await ensureNavigationId(navId);
  const rows = await db
    .select({
      id: navItems.id,
      label: navItems.label,
      position: navItems.position,
      target: navItems.target,
    })
    .from(navItems)
    .where(eq(navItems.navigationId, navigationId))
    .orderBy(asc(navItems.position));

  return mapNavRows(navId, rows);
}

/**
 * Replaces all navigation items for one navigation bucket transactionally.
 */
export async function replaceManagedNavItems(
  navId: NavId,
  items: ReplaceAdminNavItemInput[],
): Promise<NavItem[]> {
  const navigationId = await ensureNavigationId(navId);

  await db.transaction(async (tx) => {
    await tx.delete(navItems).where(eq(navItems.navigationId, navigationId));

    if (items.length === 0) return;

    await tx.insert(navItems).values(
      items.map((item, position) => ({
        id: `nav_item_${randomUUID()}`,
        navigationId,
        parentId: null,
        position,
        label: item.label ?? "",
        icon: null,
        target: {
          pageSlug: item.pageSlug,
          target: item.target,
          type: item.pageSlug ? "page" : "url",
          url: item.url,
        } satisfies StoredNavTarget,
      })),
    );
  });

  return getManagedNavItems(navId);
}

async function mapNavRows(navId: NavId, rows: StoredNavItemRow[]): Promise<NavItem[]> {
  const parsedTargets = rows.map((row) => parseStoredTarget(row.target));
  const titles = await pageTitleMap(
    Array.from(
      new Set(
        parsedTargets.map((target) => target.pageSlug).filter((slug): slug is string => !!slug),
      ),
    ),
  );

  return rows.map((row, index) => {
    const parsedTarget = parsedTargets[index] ?? { pageSlug: null, target: "_self", url: null };

    return {
      id: row.id,
      navId,
      pageSlug: parsedTarget.pageSlug,
      pageTitle: parsedTarget.pageSlug ? (titles.get(parsedTarget.pageSlug) ?? null) : null,
      url: parsedTarget.url,
      target: parsedTarget.target,
      label: row.label || null,
      position: row.position,
    };
  });
}
