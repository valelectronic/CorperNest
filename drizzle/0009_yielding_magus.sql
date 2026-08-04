CREATE TABLE "marketplace_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"stars" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_listing" ADD COLUMN "waybill_details" text;--> statement-breakpoint
ALTER TABLE "marketplace_listing" ADD COLUMN "shipped_at" timestamp;--> statement-breakpoint
ALTER TABLE "marketplace_rating" ADD CONSTRAINT "marketplace_rating_transaction_id_marketplace_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."marketplace_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_rating" ADD CONSTRAINT "marketplace_rating_listing_id_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_rating" ADD CONSTRAINT "marketplace_rating_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_rating" ADD CONSTRAINT "marketplace_rating_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rating_transaction_unique" ON "marketplace_rating" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "rating_seller_idx" ON "marketplace_rating" USING btree ("seller_id");