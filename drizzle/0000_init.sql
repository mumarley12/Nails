CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."booking_source" AS ENUM('ONLINE', 'ADMIN');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"service_id" text NOT NULL,
	"add_on_id" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"price_cents" integer NOT NULL,
	"status" "appointment_status" DEFAULT 'CONFIRMED' NOT NULL,
	"source" "booking_source" DEFAULT 'ONLINE' NOT NULL,
	"notes" text,
	"manage_token_hash" text NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_manage_token_hash_unique" UNIQUE("manage_token_hash")
);
--> statement-breakpoint
CREATE TABLE "blocked_times" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"reason" text DEFAULT 'Bloqueado' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"weekday" integer PRIMARY KEY NOT NULL,
	"open" boolean DEFAULT true NOT NULL,
	"start_min" integer DEFAULT 540 NOT NULL,
	"end_min" integer DEFAULT 1140 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closed_days" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"label" text DEFAULT 'Fechado' NOT NULL,
	CONSTRAINT "closed_days_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"notes" text,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "gallery_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"appointment_id" text,
	"channel" text NOT NULL,
	"type" text NOT NULL,
	"recipient" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"admin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"text" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_staff" (
	"service_id" text NOT NULL,
	"staff_id" text NOT NULL,
	CONSTRAINT "service_staff_service_id_staff_id_pk" PRIMARY KEY("service_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Manicure' NOT NULL,
	"price_cents" integer NOT NULL,
	"duration_min" integer NOT NULL,
	"is_add_on" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"salon_name" text DEFAULT 'Polish & Glow' NOT NULL,
	"address" text DEFAULT 'Rua Castilho 39, loja B' NOT NULL,
	"postal_code" text DEFAULT '1250-068' NOT NULL,
	"city" text DEFAULT 'Lisboa' NOT NULL,
	"phone" text DEFAULT '912 345 678' NOT NULL,
	"whatsapp" text DEFAULT '912 345 678' NOT NULL,
	"email" text DEFAULT 'ola@polishandglow.pt' NOT NULL,
	"instagram" text DEFAULT '@polishandglow' NOT NULL,
	"hero_title" text DEFAULT 'Unhas Impecáveis.' NOT NULL,
	"hero_title_accent" text DEFAULT 'Sempre.' NOT NULL,
	"hero_subtitle" text DEFAULT 'Cuidado profissional das unhas num espaço calmo e acolhedor — com um tempinho só para si.' NOT NULL,
	"about_text" text DEFAULT 'Abrimos o Polish & Glow porque queríamos um salão onde apetecesse mesmo voltar — impecável, sem pressas e simpático. Cada unha é feita com carinho, por quem adora o que faz.' NOT NULL,
	"promo_active" boolean DEFAULT true NOT NULL,
	"promo_title" text DEFAULT 'Oferta Primeira Visita' NOT NULL,
	"promo_value" text DEFAULT '−20%' NOT NULL,
	"promo_text" text DEFAULT 'NA SUA PRIMEIRA VISITA!' NOT NULL,
	"logo_url" text,
	"hero_photo_url" text,
	"about_photo_url" text,
	"promo_photo_url" text,
	"alert_email" text DEFAULT 'ola@polishandglow.pt' NOT NULL,
	"email_confirmations" boolean DEFAULT true NOT NULL,
	"whatsapp_button" boolean DEFAULT true NOT NULL,
	"alert_by_email" boolean DEFAULT true NOT NULL,
	"alert_by_push" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Técnica' NOT NULL,
	"photo_url" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"work_days" integer[] DEFAULT '{0,1,2,3,4,5}'::int[] NOT NULL,
	"start_min" integer DEFAULT 540 NOT NULL,
	"end_min" integer DEFAULT 1140 NOT NULL,
	"absence_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_add_on_id_services_id_fk" FOREIGN KEY ("add_on_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_times" ADD CONSTRAINT "blocked_times_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_staff_start_idx" ON "appointments" USING btree ("staff_id","start_at");--> statement-breakpoint
CREATE INDEX "appointments_start_idx" ON "appointments" USING btree ("start_at");