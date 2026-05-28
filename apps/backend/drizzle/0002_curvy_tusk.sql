CREATE TYPE "public"."content_page_status" AS ENUM('draft', 'published', 'hidden');--> statement-breakpoint
CREATE TABLE "content_pages" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"status" "content_page_status" DEFAULT 'draft' NOT NULL,
	"show_title" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "content_pages" ADD CONSTRAINT "content_pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pages" ADD CONSTRAINT "content_pages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_pages_status_idx" ON "content_pages" USING btree ("status");