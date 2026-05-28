import type { Post, Project, SiteSettings, Tag } from "@layered/contracts";

import { defaultSettings, seedPosts, seedProjects } from "./default-content";

interface ContentRow {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  preview_text: string | null;
  image_url: string | null;
  image_alt: string | null;
  status: "draft" | "published" | "archived";
  published_at: Date | string | null;
  date?: Date | string | null;
  read_time_minutes?: number | null;
  markdown: string;
  terminal_prompt: string | null;
  tags: string[] | null;
  categories?: string[] | null;
  model?: unknown;
}

interface TopicRow {
  id: string;
  label: string;
  slug: string;
}

interface SettingsRow {
  data: unknown;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function modelValue(value: unknown): Project["model"] {
  if (!value || typeof value !== "object") return null;
  const source = value as { src?: unknown; aspect?: unknown; height?: unknown };
  if (typeof source.src !== "string") return null;
  return {
    src: source.src,
    ...(typeof source.aspect === "string" ? { aspect: source.aspect } : {}),
    ...(typeof source.height === "string" ? { height: source.height } : {}),
  };
}

export function mapSettings(row: SettingsRow | null): SiteSettings {
  const parsed = row?.data ? defaultSettingsSchemaSafe(row.data) : null;
  return parsed ?? defaultSettings;
}

function defaultSettingsSchemaSafe(data: unknown): SiteSettings | null {
  const candidate = { ...defaultSettings, ...(typeof data === "object" && data ? data : {}) };
  return candidate as SiteSettings;
}

export function mapProject(row: ContentRow): Project {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    previewText: row.preview_text,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    tags: stringArray(row.tags),
    categories: stringArray(row.categories),
    status: row.status,
    publishedAt: toIso(row.published_at),
    markdown: row.markdown,
    terminalPrompt: row.terminal_prompt,
    model: modelValue(row.model),
  };
}

export function mapPost(row: ContentRow): Post {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    previewText: row.preview_text,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    tags: stringArray(row.tags),
    status: row.status,
    publishedAt: toIso(row.published_at),
    date: toIso(row.date) ?? new Date().toISOString(),
    readTimeMinutes: row.read_time_minutes ?? null,
    markdown: row.markdown,
    terminalPrompt: row.terminal_prompt,
  };
}

export function mapTopic(row: TopicRow): Tag {
  return row;
}

export function fallbackProjects(): Project[] {
  return seedProjects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    previewText: project.previewText ?? null,
    imageUrl: project.imageUrl ?? null,
    imageAlt: project.imageAlt ?? null,
    tags: project.tags,
    categories: project.categories ?? [],
    status: project.status,
    publishedAt: project.publishedAt ?? null,
    markdown: project.markdown,
    terminalPrompt: project.terminalPrompt ?? null,
    model: project.model ?? null,
  }));
}

export function fallbackPosts(): Post[] {
  return seedPosts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    previewText: post.previewText ?? null,
    imageUrl: post.imageUrl ?? null,
    imageAlt: post.imageAlt ?? null,
    tags: post.tags,
    status: post.status,
    publishedAt: post.publishedAt ?? null,
    date: post.date ?? new Date().toISOString(),
    readTimeMinutes: post.readTimeMinutes ?? null,
    markdown: post.markdown,
    terminalPrompt: post.terminalPrompt ?? null,
  }));
}
