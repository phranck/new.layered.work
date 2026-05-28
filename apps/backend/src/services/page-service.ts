import type { ContentPage, ContentPageSummary, ContentStatus } from "@layered/contracts";

import { query, queryOne } from "../db/client";

interface ContentPageRow {
  slug: string;
  title: string;
  content?: string;
  status: ContentStatus;
  show_title: boolean;
  created_at: Date | string;
  created_by_username: string | null;
  updated_at: Date | string | null;
  updated_by_username: string | null;
}

interface CreateContentPageInput {
  slug: string;
  title: string;
  status?: ContentStatus;
  userId: string;
}

interface PatchContentPageInput {
  slug?: string;
  title?: string;
  status?: ContentStatus;
  showTitle?: boolean;
}

const SUMMARY_SELECT = `
  select
    cp.slug,
    cp.title,
    cp.status,
    cp.show_title,
    cp.created_at,
    created_by.login as created_by_username,
    cp.updated_at,
    updated_by.login as updated_by_username
  from content_pages cp
  left join users created_by on created_by.id = cp.created_by
  left join users updated_by on updated_by.id = cp.updated_by
`;

export async function listManagedContentPages(): Promise<ContentPageSummary[]> {
  const rows = await query<ContentPageRow>(`
    ${SUMMARY_SELECT}
    order by lower(cp.title) asc
  `);
  return rows.map(mapContentPageSummary);
}

export async function getManagedContentPage(slug: string): Promise<ContentPage> {
  const row = await queryOne<ContentPageRow>(
    `
      ${SUMMARY_SELECT.replace("cp.status,", "cp.content, cp.status,")}
      where cp.slug = $1
    `,
    [slug],
  );

  if (!row) {
    throw new Error("Content page not found");
  }

  return mapContentPage(row);
}

export async function createManagedContentPage(
  input: CreateContentPageInput,
): Promise<ContentPageSummary> {
  await ensureSlugAvailable(input.slug);

  const row = await queryOne<{ slug: string }>(
    `
      insert into content_pages (slug, title, status, created_by)
      values ($1, $2, $3, $4)
      returning slug
    `,
    [input.slug, input.title, input.status ?? "draft", input.userId],
  );

  if (!row) {
    throw new Error("Content page creation failed");
  }

  return toContentPageSummary(await getManagedContentPage(row.slug));
}

export async function saveManagedContentPage(
  slug: string,
  content: string,
  userId: string,
): Promise<ContentPage> {
  const row = await queryOne<{ slug: string }>(
    `
      update content_pages
      set content = $2, updated_at = now(), updated_by = $3
      where slug = $1
      returning slug
    `,
    [slug, content, userId],
  );

  if (!row) {
    throw new Error("Content page not found");
  }

  return getManagedContentPage(row.slug);
}

export async function patchManagedContentPage(
  slug: string,
  input: PatchContentPageInput,
  userId: string,
): Promise<ContentPageSummary> {
  if (input.slug && input.slug !== slug) {
    await ensureSlugAvailable(input.slug);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  function add(column: string, value: unknown) {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  }

  if (input.slug !== undefined) add("slug", input.slug);
  if (input.title !== undefined) add("title", input.title);
  if (input.status !== undefined) add("status", input.status);
  if (input.showTitle !== undefined) add("show_title", input.showTitle);

  values.push(userId);
  updates.push(`updated_at = now()`, `updated_by = $${values.length}`);

  values.push(slug);

  const row = await queryOne<{ slug: string }>(
    `
      update content_pages
      set ${updates.join(", ")}
      where slug = $${values.length}
      returning slug
    `,
    values,
  );

  if (!row) {
    throw new Error("Content page not found");
  }

  return toContentPageSummary(await getManagedContentPage(row.slug));
}

export async function deleteManagedContentPage(slug: string): Promise<void> {
  const row = await queryOne<{ slug: string }>(
    "delete from content_pages where slug = $1 returning slug",
    [slug],
  );

  if (!row) {
    throw new Error("Content page not found");
  }
}

async function ensureSlugAvailable(slug: string) {
  const existing = await queryOne<{ slug: string }>(
    "select slug from content_pages where slug = $1",
    [slug],
  );

  if (existing) {
    throw new Error("Slug already exists");
  }
}

function mapContentPage(row: ContentPageRow): ContentPage {
  return {
    ...mapContentPageSummary(row),
    content: row.content ?? "",
  };
}

function toContentPageSummary(page: ContentPage): ContentPageSummary {
  return {
    slug: page.slug,
    title: page.title,
    status: page.status,
    showTitle: page.showTitle,
    createdAt: page.createdAt,
    createdByUsername: page.createdByUsername,
    updatedAt: page.updatedAt,
    updatedByUsername: page.updatedByUsername,
  };
}

function mapContentPageSummary(row: ContentPageRow): ContentPageSummary {
  return {
    slug: row.slug,
    title: row.title,
    status: row.status,
    showTitle: row.show_title,
    createdAt: toIso(row.created_at),
    createdByUsername: row.created_by_username,
    updatedAt: toNullableIso(row.updated_at),
    updatedByUsername: row.updated_by_username,
  };
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return toIso(value);
}
