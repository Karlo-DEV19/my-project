CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "blinds_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(100),
	"characteristic" varchar(150),
	"composition" varchar(150),
	"fabric_width" varchar(50),
	"packing" varchar(50),
	"thickness" varchar(50),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"unit_price" integer NOT NULL,
	"collection" varchar(50) DEFAULT 'Shop Only' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blinds_product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blinds_product_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"exp   ires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_code" varchar(120) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"color_id" uuid,
	"color_name" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_number" varchar(50) NOT NULL,
	"reference_number" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'unpaid' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"order_type" varchar(50) NOT NULL,
	"customer_first_name" varchar(100) NOT NULL,
	"customer_last_name" varchar(100) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_phone_secondary" varchar(20),
	"delivery_unit_floor" varchar(50),
	"delivery_street" varchar(255),
	"delivery_barangay" varchar(150),
	"delivery_city" varchar(100),
	"delivery_province" varchar(100),
	"delivery_zip_code" varchar(10),
	"delivery_formatted_address" text,
	"delivery_lat" numeric(10, 8),
	"delivery_lng" numeric(11, 8),
	"delivery_notes" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"vat" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"cancelled_by" varchar(50),
	"cancellation_reason" text,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"payment_intent_id" varchar(100),
	"session_id" varchar(100),
	"reference_number" varchar(100),
	"idempotency_key" varchar(255),
	"amount_paid" numeric(10, 2),
	"vat" numeric(10, 2),
	"net_amount" numeric(10, 2),
	"paid_at" timestamp,
	"expires_at" timestamp,
	"raw_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"module" varchar(50) NOT NULL,
	"reference_id" uuid,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blinds_product_images" ADD CONSTRAINT "blinds_product_images_product_id_blinds_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."blinds_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinds_product_colors" ADD CONSTRAINT "blinds_product_colors_product_id_blinds_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."blinds_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_blinds_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."blinds_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_color_id_blinds_product_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."blinds_product_colors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blinds_products_product_code_unique" ON "blinds_products" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "otp_email_idx" ON "otp_codes" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_tracking_number_unique" ON "orders" USING btree ("tracking_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_reference_number_unique" ON "orders" USING btree ("reference_number");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_history_idempotency_key_unique" ON "payment_history" USING btree ("idempotency_key");