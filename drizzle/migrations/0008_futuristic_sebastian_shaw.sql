ALTER TABLE "blinds_products" ADD COLUMN "enable_promo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "blinds_products" ADD COLUMN "discount_type" varchar(20);--> statement-breakpoint
ALTER TABLE "blinds_products" ADD COLUMN "discount_value" real;