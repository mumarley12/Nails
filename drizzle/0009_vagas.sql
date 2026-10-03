-- Vagas: a Matilde publica horas exatas (1 cliente por vaga), semana a semana.
CREATE TABLE IF NOT EXISTS "vagas" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"start_min" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vagas_date_start_uq" ON "vagas" USING btree ("date","start_min");--> statement-breakpoint
ALTER TABLE "vagas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "vagas" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "vagas" FROM authenticated; END IF;
END $$;--> statement-breakpoint
-- O horário por blocos deixou de existir.
DROP TABLE IF EXISTS "week_days";
