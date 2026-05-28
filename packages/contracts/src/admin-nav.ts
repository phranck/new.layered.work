import { z } from "zod";

import { isSafeConfiguredUrl } from "./safe-url";

export const navIdSchema = z.enum(["header", "footer"]);
export const navTargetSchema = z.enum(["_self", "_blank"]);

export const navItemSchema = z.object({
  id: z.string(),
  navId: navIdSchema,
  pageSlug: z.string().nullable(),
  pageTitle: z.string().nullable(),
  url: z.string().nullable(),
  target: navTargetSchema,
  label: z.string().nullable(),
  position: z.number().int(),
});

/**
 * Navigation items replacement payload contract.
 */
export const navItemsSchema = z.object({
  items: z.array(
    z.object({
      pageSlug: z.string().min(1).nullish(),
      url: z
        .string()
        .min(1)
        .refine(
          (value) =>
            isSafeConfiguredUrl(value, {
              allowHash: true,
              allowMailto: true,
              allowRelative: true,
              allowTel: true,
            }),
          {
            message: "url must be a hash, relative path, safe URL, mailto or tel link",
          },
        )
        .nullish(),
      label: z.string().max(100).nullish(),
      target: navTargetSchema.default("_self"),
    }),
  ),
});

export type NavId = z.infer<typeof navIdSchema>;
export type NavTarget = z.infer<typeof navTargetSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
