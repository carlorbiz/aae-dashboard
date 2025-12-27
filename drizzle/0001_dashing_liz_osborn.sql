ALTER TYPE "public"."platform" ADD VALUE 'gamma';--> statement-breakpoint
ALTER TYPE "public"."platform" ADD VALUE 'docsautomator';--> statement-breakpoint
ALTER TABLE "entities" ALTER COLUMN "properties" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "knowledge_items" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "platform_integrations" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "relationships" ALTER COLUMN "properties" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "semantic_history" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "metadata" SET DATA TYPE jsonb;