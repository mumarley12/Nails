-- Impede marcações sobrepostas para a mesma técnica, mesmo que duas clientes
-- carreguem em "Confirmar" ao mesmo tempo. Só conta marcações ativas.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap"
  EXCLUDE USING gist (
    "staff_id" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING', 'CONFIRMED'));
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_time_order" CHECK ("end_at" > "start_at");
