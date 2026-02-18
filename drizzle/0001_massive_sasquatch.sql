ALTER TABLE "commentary" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "commentary" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commentary" ALTER COLUMN "tags" SET DATA TYPE text[];