CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(100) NOT NULL,
	"label" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_options_type_value_unique" UNIQUE("type","value"),
	CONSTRAINT "product_options_type_label_unique" UNIQUE("type","label")
);
--> statement-breakpoint
CREATE INDEX "product_options_type_idx" ON "product_options" USING btree ("type");