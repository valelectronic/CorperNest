CREATE TABLE "marketplace_offer" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"listed_price" integer NOT NULL,
	"latest_amount" integer NOT NULL,
	"counter_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"history" text DEFAULT '[]' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_offer" ADD CONSTRAINT "marketplace_offer_listing_id_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_offer" ADD CONSTRAINT "marketplace_offer_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_offer" ADD CONSTRAINT "marketplace_offer_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offer_listingId_idx" ON "marketplace_offer" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "offer_buyerId_idx" ON "marketplace_offer" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "offer_sellerId_idx" ON "marketplace_offer" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "offer_status_idx" ON "marketplace_offer" USING btree ("status");