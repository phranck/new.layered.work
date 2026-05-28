import type { DesignTokens } from "@layered/contracts";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const publishStatus = pgEnum("publish_status", ["draft", "published", "archived"]);
export const contentWidth = pgEnum("content_width", [
  "narrow",
  "default",
  "medium",
  "wide",
  "full",
]);
export const contentMode = pgEnum("content_mode", ["wysiwyg", "markdown"]);
export const contentPageStatus = pgEnum("content_page_status", ["draft", "published", "hidden"]);
export const userRole = pgEnum("user_role", ["owner", "admin", "editor"]);
export const variableType = pgEnum("variable_type", [
  "string",
  "rich-text",
  "url",
  "image",
  "number",
  "boolean",
  "date",
  "json",
  "color",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    login: text("login").notNull().unique(),
    displayName: text("display_name").notNull(),
    role: userRole("role").notNull().default("admin"),
    passwordHash: text("password_hash"),
    locale: text("locale").notNull().default("en"),
    avatarUrl: text("avatar_url"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_single_owner_idx").on(table.role).where(sql`${table.role} = 'owner'`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<unknown>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption"),
  focal: jsonb("focal").$type<{ x: number; y: number }>().notNull().default({ x: 0.5, y: 0.5 }),
  watermark: jsonb("watermark").$type<unknown>(),
  variants: jsonb("variants").$type<unknown[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  storageKey: text("storage_key"),
  attribution: jsonb("attribution").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique(),
    title: text("title"),
    description: text("description"),
    imageId: text("image_id").references(() => media.id, { onDelete: "set null" }),
    previewText: text("preview_text"),
    contentWidth: contentWidth("content_width").notNull().default("default"),
    contentMode: contentMode("content_mode").notNull().default("markdown"),
    markdown: text("markdown").notNull().default(""),
    terminalPrompt: text("terminal_prompt"),
    status: publishStatus("status").notNull().default("draft"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    readTimeMinutes: integer("read_time_minutes"),
    slugLocked: boolean("slug_locked").notNull().default(false),
    readTimeOffsetSeconds: integer("read_time_offset_seconds").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("posts_date_idx").on(table.date), index("posts_slug_idx").on(table.slug)],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique(),
    title: text("title"),
    description: text("description"),
    imageId: text("image_id").references(() => media.id, { onDelete: "set null" }),
    previewText: text("preview_text"),
    contentWidth: contentWidth("content_width").notNull().default("default"),
    contentMode: contentMode("content_mode").notNull().default("markdown"),
    markdown: text("markdown").notNull().default(""),
    terminalPrompt: text("terminal_prompt"),
    status: publishStatus("status").notNull().default("draft"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    categories: jsonb("categories").$type<string[]>().notNull().default([]),
    model: jsonb("model").$type<{ src: string; aspect?: string; height?: string } | null>(),
    slugLocked: boolean("slug_locked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("projects_slug_idx").on(table.slug)],
);

export const postTopics = pgTable(
  "post_topics",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.topicId] })],
);

export const projectTopics = pgTable(
  "project_topics",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.topicId] })],
);

export const contentPages = pgTable(
  "content_pages",
  {
    slug: text("slug").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    status: contentPageStatus("status").notNull().default("draft"),
    showTitle: boolean("show_title").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [index("content_pages_status_idx").on(table.status)],
);

export const navigations = pgTable("navigations", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const navItems = pgTable("nav_items", {
  id: text("id").primaryKey(),
  navigationId: text("navigation_id")
    .notNull()
    .references(() => navigations.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnyPgColumn => navItems.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  label: text("label").notNull(),
  icon: text("icon"),
  target: jsonb("target").$type<unknown>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const variables = pgTable("variables", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  type: variableType("type").notNull(),
  value: jsonb("value").$type<DesignTokens | unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
