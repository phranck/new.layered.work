import { z } from "zod";

export * from "./admin-nav";

export const tagSchema = z.object({
  id: z.string(),
  label: z.string(),
  slug: z.string(),
});

export const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string(),
});

export const projectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  previewText: z.string().nullable(),
  imageUrl: z.string().nullable(),
  imageAlt: z.string().nullable(),
  tags: z.array(z.string()),
  categories: z.array(z.string()),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().nullable(),
  markdown: z.string(),
  terminalPrompt: z.string().nullable(),
  model: z
    .object({
      src: z.string(),
      aspect: z.string().optional(),
      height: z.string().optional(),
    })
    .nullable(),
});

export const postSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  previewText: z.string().nullable(),
  imageUrl: z.string().nullable(),
  imageAlt: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().nullable(),
  date: z.string(),
  readTimeMinutes: z.number().int().nullable(),
  markdown: z.string(),
  terminalPrompt: z.string().nullable(),
});

export const designTokensSchema = z.object({
  colors: z.object({
    bg: z.string(),
    bgElev: z.string(),
    border: z.string(),
    text: z.string(),
    muted: z.string(),
    accent: z.string(),
    accentDim: z.string(),
    stripeTeal: z.string(),
    stripeOlive: z.string(),
    stripeGold: z.string(),
    stripeBurnt: z.string(),
  }),
  typography: z.object({
    bodyFamily: z.string(),
    monoFamily: z.string(),
    headingWeight: z.number().int(),
    bodyWeight: z.number().int(),
  }),
  radius: z.object({
    card: z.number(),
    image: z.number(),
    control: z.number(),
  }),
  terminal: z.object({
    promptColor: z.string(),
    cursorColor: z.string(),
    showCursor: z.boolean(),
  }),
});

export const siteSettingsSchema = z.object({
  title: z.string(),
  versionLabel: z.string(),
  navigation: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      href: z.string(),
    }),
  ),
  home: z.object({
    heroPrompt: z.string(),
    heroNameA: z.string(),
    heroNameB: z.string(),
    heroLineMutedA: z.string(),
    heroLineGold: z.string(),
    heroLineMutedB: z.string(),
    heroLineBurnt: z.string(),
    intro: z.string(),
    featuredPostSlug: z.string(),
    pressHint: z.string(),
  }),
  about: z.object({
    prompt: z.string(),
    paragraphs: z.array(z.string()),
    stack: z.array(z.object({ label: z.string(), value: z.string() })),
    socials: z.array(z.object({ label: z.string(), href: z.string(), icon: z.string() })),
  }),
  footer: z.object({
    eofLabel: z.string(),
    locationText: z.string(),
    copyright: z.string(),
  }),
  blog: z.object({
    pageSize: z.number().int().min(1).max(24),
    gridPreviewLength: z.number().int().min(40).max(400),
    listPreviewLength: z.number().int().min(80).max(800),
  }),
  projects: z.object({
    gridPreviewLength: z.number().int().min(40).max(400),
    listPreviewLength: z.number().int().min(80).max(800),
    visibleFilterCount: z.number().int().min(2).max(12),
  }),
  design: designTokensSchema,
});

export const publicSiteDataSchema = z.object({
  settings: siteSettingsSchema,
  projects: z.array(projectSchema),
  posts: z.array(postSchema),
  topics: z.array(tagSchema),
});

export const contentStatusSchema = z.enum(["draft", "published", "hidden"]);

export const contentPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  status: contentStatusSchema,
  showTitle: z.boolean(),
  createdAt: z.string(),
  createdByUsername: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedByUsername: z.string().nullable(),
});

export const contentPageSummarySchema = contentPageSchema.omit({ content: true });

const contentSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens are allowed");

export const contentCreateSchema = z.object({
  slug: contentSlugSchema,
  title: z.string().min(1).max(200),
  status: contentStatusSchema.optional(),
});

export const contentUpdateSchema = z.object({
  content: z.string().max(100_000),
});

export const contentMetaSchema = z.object({
  slug: contentSlugSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  status: contentStatusSchema.optional(),
  showTitle: z.boolean().optional(),
});

export const contentMutationSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  previewText: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageAlt: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  date: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
  readTimeMinutes: z.number().int().nullable().optional(),
  markdown: z.string().default(""),
  terminalPrompt: z.string().nullable().optional(),
  model: z
    .object({
      src: z.string(),
      aspect: z.string().optional(),
      height: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export const adminRoleSchema = z.enum(["owner", "admin", "editor"]);

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  login: z.string(),
  displayName: z.string(),
  role: adminRoleSchema,
  isOwner: z.boolean(),
  locale: z.string(),
  avatarUrl: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const authStatusSchema = z.object({
  needsSetup: z.boolean(),
});

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const setupSchema = z.object({
  email: z.string().email(),
  login: z.string().min(2),
  displayName: z.string().min(2),
  password: z.string().min(10),
});

export const userMutationSchema = z.object({
  email: z.string().email(),
  login: z.string().min(2),
  displayName: z.string().min(2),
  role: adminRoleSchema.default("admin"),
  locale: z.string().min(2).default("en"),
  password: z.string().min(10).optional().or(z.literal("")),
});

export const userUpdateSchema = userMutationSchema.partial().extend({
  password: z.string().min(10).optional().or(z.literal("")),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: adminUserSchema,
});

export type Tag = z.infer<typeof tagSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Post = z.infer<typeof postSchema>;
export type DesignTokens = z.infer<typeof designTokensSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type PublicSiteData = z.infer<typeof publicSiteDataSchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type ContentPage = z.infer<typeof contentPageSchema>;
export type ContentPageSummary = z.infer<typeof contentPageSummarySchema>;
export type ContentMutation = z.infer<typeof contentMutationSchema>;
export type AdminRole = z.infer<typeof adminRoleSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AuthStatus = z.infer<typeof authStatusSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
export type UserMutation = z.infer<typeof userMutationSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
