ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_1_5" CHECK ("rating" BETWEEN 1 AND 5);
