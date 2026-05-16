ALTER TABLE "order_items" ADD COLUMN "regular_unit_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_type" varchar(20);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_value" real;