ALTER TABLE "orders" ADD COLUMN "downpayment_amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "downpayment_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "downpayment_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "balance_amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "balance_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "payment_history" ADD COLUMN "payment_type" varchar(50) DEFAULT 'downpayment' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_history" ADD COLUMN "amount_due" numeric(10, 2);