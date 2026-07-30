CREATE TABLE "marketplace_availability_request" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"offer_id" text,
	"agreed_price" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmed_by" text,
	"confirmation_method" text,
	"admin_note" text,
	"checkout_expires_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_availability_request" ADD CONSTRAINT "marketplace_availability_request_listing_id_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_availability_request" ADD CONSTRAINT "marketplace_availability_request_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_availability_request" ADD CONSTRAINT "marketplace_availability_request_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "avail_request_listingId_idx" ON "marketplace_availability_request" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "avail_request_buyerId_idx" ON "marketplace_availability_request" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "avail_request_status_idx" ON "marketplace_availability_request" USING btree ("status");