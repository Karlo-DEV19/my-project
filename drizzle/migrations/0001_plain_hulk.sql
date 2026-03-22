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
ALTER TABLE "blinds_product_images" ADD CONSTRAINT "blinds_product_images_product_id_blinds_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."blinds_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blinds_product_colors" ADD CONSTRAINT "blinds_product_colors_product_id_blinds_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."blinds_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blinds_products_product_code_unique" ON "blinds_products" USING btree ("product_code");