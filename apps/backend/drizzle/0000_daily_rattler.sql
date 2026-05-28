CREATE TYPE "public"."content_mode" AS ENUM('wysiwyg', 'markdown');--> statement-breakpoint
CREATE TYPE "public"."content_width" AS ENUM('narrow', 'default', 'medium', 'wide', 'full');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TYPE "public"."variable_type" AS ENUM('string', 'rich-text', 'url', 'image', 'number', 'boolean', 'date', 'json', 'color');--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"caption" text,
	"focal" jsonb DEFAULT '{"x":0.5,"y":0.5}'::jsonb NOT NULL,
	"watermark" jsonb,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"storage_key" text,
	"attribution" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "nav_items" (
	"id" text PRIMARY KEY NOT NULL,
	"navigation_id" text NOT NULL,
	"parent_id" text,
	"position" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"icon" text,
	"target" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigations" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "navigations_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "post_topics" (
	"post_id" text NOT NULL,
	"topic_id" text NOT NULL,
	CONSTRAINT "post_topics_post_id_topic_id_pk" PRIMARY KEY("post_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text,
	"title" text,
	"description" text,
	"image_id" text,
	"preview_text" text,
	"content_width" "content_width" DEFAULT 'default' NOT NULL,
	"content_mode" "content_mode" DEFAULT 'markdown' NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"terminal_prompt" text,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"author_id" text NOT NULL,
	"published_at" timestamp with time zone,
	"date" timestamp with time zone NOT NULL,
	"read_time_minutes" integer,
	"slug_locked" boolean DEFAULT false NOT NULL,
	"read_time_offset_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_topics" (
	"project_id" text NOT NULL,
	"topic_id" text NOT NULL,
	CONSTRAINT "project_topics_project_id_topic_id_pk" PRIMARY KEY("project_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text,
	"title" text,
	"description" text,
	"image_id" text,
	"preview_text" text,
	"content_width" "content_width" DEFAULT 'default' NOT NULL,
	"content_mode" "content_mode" DEFAULT 'markdown' NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"terminal_prompt" text,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"author_id" text NOT NULL,
	"published_at" timestamp with time zone,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" jsonb,
	"slug_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"login" text NOT NULL,
	"display_name" text NOT NULL,
	"role" "user_role" DEFAULT 'editor' NOT NULL,
	"password_hash" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_login_unique" UNIQUE("login")
);
--> statement-breakpoint
CREATE TABLE "variables" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"type" "variable_type" NOT NULL,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "variables_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "nav_items" ADD CONSTRAINT "nav_items_navigation_id_navigations_id_fk" FOREIGN KEY ("navigation_id") REFERENCES "public"."navigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nav_items" ADD CONSTRAINT "nav_items_parent_id_nav_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."nav_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_topics" ADD CONSTRAINT "post_topics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_topics" ADD CONSTRAINT "post_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_topics" ADD CONSTRAINT "project_topics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_topics" ADD CONSTRAINT "project_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_date_idx" ON "posts" USING btree ("date");--> statement-breakpoint
CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");