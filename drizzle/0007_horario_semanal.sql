ALTER TABLE "business_hours" ADD COLUMN IF NOT EXISTS "start2_min" integer;--> statement-breakpoint
ALTER TABLE "business_hours" ADD COLUMN IF NOT EXISTS "end2_min" integer;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "week_days" (
	"date" text PRIMARY KEY NOT NULL,
	"open" boolean DEFAULT false NOT NULL,
	"start_min" integer DEFAULT 540 NOT NULL,
	"end_min" integer DEFAULT 1140 NOT NULL,
	"start2_min" integer,
	"end2_min" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "week_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "week_days" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "week_days" FROM authenticated; END IF;
END $$;
--> statement-breakpoint
-- A Matilde estuda de segunda a sexta: se o horário base ainda for o de exemplo, fica só o sábado.
UPDATE "business_hours" SET "open" = false
WHERE "weekday" BETWEEN 0 AND 4
  AND NOT EXISTS (SELECT 1 FROM "business_hours" WHERE NOT ("start_min" = 540 AND "end_min" = 1140));
