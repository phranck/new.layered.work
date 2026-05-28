import type {
  ContentMutation,
  Post,
  Project,
  PublicSiteData,
  SiteSettings,
  Tag,
} from "@layered/contracts";
import { query, queryOne, transaction } from "../db/client";
import { defaultSettings, seedPosts, seedProjects } from "../db/default-content";
import {
  fallbackPosts,
  fallbackProjects,
  mapPost,
  mapProject,
  mapSettings,
  mapTopic,
} from "../db/rows";

const PUBLIC_STATUS = "published";

export class ContentService {
  async publicSiteData(): Promise<PublicSiteData> {
    const [settings, projects, posts, topics] = await Promise.all([
      this.settings(),
      this.projects({ publicOnly: true }),
      this.posts({ publicOnly: true }),
      this.topics(),
    ]);

    return {
      settings,
      projects: projects.length > 0 ? projects : fallbackProjects(),
      posts: posts.length > 0 ? posts : fallbackPosts(),
      topics,
    };
  }

  async settings(): Promise<SiteSettings> {
    const row = await queryOne<{ data: unknown }>("select data from site_settings where id = $1", [
      "main",
    ]);
    return mapSettings(row);
  }

  async saveSettings(settings: SiteSettings): Promise<SiteSettings> {
    const row = await queryOne<{ data: unknown }>(
      `
        insert into site_settings (id, data, updated_at)
        values ($1, $2::jsonb, now())
        on conflict (id) do update set data = excluded.data, updated_at = now()
        returning data
      `,
      ["main", JSON.stringify(settings)],
    );
    return mapSettings(row);
  }

  async projects({ publicOnly = false }: { publicOnly?: boolean } = {}): Promise<Project[]> {
    const statusClause = publicOnly ? "where p.status = $1 and p.slug is not null" : "";
    const values = publicOnly ? [PUBLIC_STATUS] : [];
    const rows = await query<Parameters<typeof mapProject>[0]>(
      `
        select
          p.id,
          p.slug,
          p.title,
          p.description,
          p.preview_text,
          m.storage_key as image_url,
          m.alt as image_alt,
          p.status,
          p.published_at,
          p.markdown,
          p.terminal_prompt,
          p.categories,
          p.model,
          coalesce(array_agg(t.label order by t.label) filter (where t.id is not null), '{}') as tags
        from projects p
        left join media m on m.id = p.image_id
        left join project_topics pt on pt.project_id = p.id
        left join topics t on t.id = pt.topic_id
        ${statusClause}
        group by p.id, m.storage_key, m.alt
        order by coalesce(p.published_at, p.created_at) desc
      `,
      values,
    );
    return rows.map(mapProject);
  }

  async posts({ publicOnly = false }: { publicOnly?: boolean } = {}): Promise<Post[]> {
    const statusClause = publicOnly ? "where p.status = $1 and p.slug is not null" : "";
    const values = publicOnly ? [PUBLIC_STATUS] : [];
    const rows = await query<Parameters<typeof mapPost>[0]>(
      `
        select
          p.id,
          p.slug,
          p.title,
          p.description,
          p.preview_text,
          m.storage_key as image_url,
          m.alt as image_alt,
          p.status,
          p.published_at,
          p.date,
          p.read_time_minutes,
          p.markdown,
          p.terminal_prompt,
          coalesce(array_agg(t.label order by t.label) filter (where t.id is not null), '{}') as tags
        from posts p
        left join media m on m.id = p.image_id
        left join post_topics pt on pt.post_id = p.id
        left join topics t on t.id = pt.topic_id
        ${statusClause}
        group by p.id, m.storage_key, m.alt
        order by p.date desc
      `,
      values,
    );
    return rows.map(mapPost);
  }

  async topics(): Promise<Tag[]> {
    const rows = await query<Parameters<typeof mapTopic>[0]>(
      "select id, label, slug from topics order by label asc",
    );
    return rows.map(mapTopic);
  }

  async upsertPost(input: ContentMutation): Promise<Post> {
    const id = `post_${input.slug.replace(/[^a-z0-9]+/gi, "_")}`;
    await transaction(async (client) => {
      const authorId = await ensureAuthor(client);
      const imageId = await ensureMedia(
        client,
        input.imageUrl ?? null,
        input.imageAlt ?? input.title,
      );
      await client.query(
        `
          insert into posts (
            id, slug, title, description, preview_text, image_id, status, author_id, published_at,
            date, read_time_minutes, markdown, terminal_prompt, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11, $12, $13, now())
          on conflict (id) do update set
            slug = excluded.slug,
            title = excluded.title,
            description = excluded.description,
            preview_text = excluded.preview_text,
            image_id = excluded.image_id,
            status = excluded.status,
            published_at = excluded.published_at,
            date = excluded.date,
            read_time_minutes = excluded.read_time_minutes,
            markdown = excluded.markdown,
            terminal_prompt = excluded.terminal_prompt,
            updated_at = now()
        `,
        [
          id,
          input.slug,
          input.title,
          input.description,
          input.previewText ?? null,
          imageId,
          input.status,
          authorId,
          input.publishedAt ?? null,
          input.date ?? input.publishedAt ?? new Date().toISOString(),
          input.readTimeMinutes ?? null,
          input.markdown,
          input.terminalPrompt ?? null,
        ],
      );
      await replaceTopics(client, "post", id, input.tags);
    });
    const post = (await this.posts()).find((item) => item.id === id);
    if (!post) throw new Error(`Post ${id} was not written`);
    return post;
  }

  async upsertProject(input: ContentMutation): Promise<Project> {
    const id = `project_${input.slug.replace(/[^a-z0-9]+/gi, "_")}`;
    await transaction(async (client) => {
      const authorId = await ensureAuthor(client);
      const imageId = await ensureMedia(
        client,
        input.imageUrl ?? null,
        input.imageAlt ?? input.title,
      );
      await client.query(
        `
          insert into projects (
            id, slug, title, description, preview_text, image_id, status, author_id, published_at,
            categories, model, markdown, terminal_prompt, updated_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::jsonb, $11::jsonb, $12, $13, now())
          on conflict (id) do update set
            slug = excluded.slug,
            title = excluded.title,
            description = excluded.description,
            preview_text = excluded.preview_text,
            image_id = excluded.image_id,
            status = excluded.status,
            published_at = excluded.published_at,
            categories = excluded.categories,
            model = excluded.model,
            markdown = excluded.markdown,
            terminal_prompt = excluded.terminal_prompt,
            updated_at = now()
        `,
        [
          id,
          input.slug,
          input.title,
          input.description,
          input.previewText ?? null,
          imageId,
          input.status,
          authorId,
          input.publishedAt ?? null,
          JSON.stringify(input.categories ?? []),
          input.model ? JSON.stringify(input.model) : null,
          input.markdown,
          input.terminalPrompt ?? null,
        ],
      );
      await replaceTopics(client, "project", id, input.tags);
    });
    const project = (await this.projects()).find((item) => item.id === id);
    if (!project) throw new Error(`Project ${id} was not written`);
    return project;
  }

  async seedDefaults(): Promise<void> {
    await this.saveSettings(defaultSettings);

    for (const project of seedProjects) {
      await this.upsertProject(project);
    }

    for (const post of seedPosts) {
      await this.upsertPost(post);
    }
  }
}

async function ensureAuthor(client: {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Array<{ id: string }> }>;
}) {
  const existing = await client.query("select id from users order by created_at asc limit 1");
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query(
    `
      insert into users (id, email, login, display_name, role)
      values ($1, $2, $3, $4, $5)
      returning id
    `,
    ["user_admin", "admin@layered.work", "admin", "admin", "admin"],
  );
  return inserted.rows[0].id;
}

async function ensureMedia(
  client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Array<{ id: string }> }> },
  url: string | null,
  alt: string,
): Promise<string | null> {
  if (!url) return null;

  const id = `media_${slugify(url)}`;
  await client.query(
    `
      insert into media (id, filename, mime, size, width, height, alt, storage_key, updated_at)
      values ($1, $2, $3, 0, 0, 0, $4, $5, now())
      on conflict (id) do update set alt = excluded.alt, storage_key = excluded.storage_key, updated_at = now()
    `,
    [id, id, "image/jpeg", alt, url],
  );
  return id;
}

async function replaceTopics(
  client: { query: (text: string, values?: unknown[]) => Promise<unknown> },
  kind: "post" | "project",
  contentId: string,
  labels: string[],
): Promise<void> {
  const joinTable = kind === "post" ? "post_topics" : "project_topics";
  const idColumn = kind === "post" ? "post_id" : "project_id";
  await client.query(`delete from ${joinTable} where ${idColumn} = $1`, [contentId]);

  for (const label of labels) {
    const topicId = `topic_${slugify(label)}`;
    const slug = slugify(label);
    await client.query(
      `
        insert into topics (id, label, slug, updated_at)
        values ($1, $2, $3, now())
        on conflict (id) do update set label = excluded.label, slug = excluded.slug, updated_at = now()
      `,
      [topicId, label, slug],
    );
    await client.query(
      `insert into ${joinTable} (${idColumn}, topic_id) values ($1, $2) on conflict do nothing`,
      [contentId, topicId],
    );
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
