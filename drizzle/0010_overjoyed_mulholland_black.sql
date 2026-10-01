CREATE TABLE "parkout_ambassador" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"state" text NOT NULL,
	"lga" text NOT NULL,
	"zone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"bank_code" text,
	"account_number" text,
	"account_name" text,
	"recipient_code" text,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_deals" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parkout_ambassador_application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vet_fee_ref" text,
	"vet_fee_paid_at" timestamp,
	"full_name" text,
	"phone" text,
	"whatsapp_number" text,
	"territory_state" text,
	"territory_lga" text,
	"id_type" text,
	"id_number" text,
	"id_document_url" text,
	"bank_code" text,
	"account_number" text,
	"account_name" text,
	"admin_note" text,
	"rejection_reason" text,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parkout_inspection" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"incoming_user_id" text NOT NULL,
	"slot_number" integer DEFAULT 1 NOT NULL,
	"booking_fee" integer DEFAULT 300000 NOT NULL,
	"paystack_ref" text,
	"paid_at" timestamp,
	"lock_expires_at" timestamp,
	"outcome" text,
	"outcome_reason" text,
	"outcome_at" timestamp,
	"refund_amount" integer,
	"refunded_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parkout_listing" (
	"id" text PRIMARY KEY NOT NULL,
	"outgoing_user_id" text NOT NULL,
	"ambassador_id" text,
	"title" text NOT NULL,
	"room_type" text NOT NULL,
	"state" text NOT NULL,
	"lga" text NOT NULL,
	"neighbourhood" text NOT NULL,
	"annual_rent" integer NOT NULL,
	"facilitation_fee" integer NOT NULL,
	"caution_deposit" integer,
	"advance_rent" text,
	"move_out_date" timestamp NOT NULL,
	"description" text,
	"landlord_rules" text,
	"transport_estimates" json,
	"move_in_fees" json,
	"has_furniture_for_sale" boolean DEFAULT false NOT NULL,
	"items_available" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"occupancy_proof_url" text NOT NULL,
	"has_landlord_agent" boolean DEFAULT false NOT NULL,
	"landlord_aware" boolean DEFAULT false NOT NULL,
	"landlord_consent_confirmed" boolean DEFAULT false NOT NULL,
	"exact_address" text NOT NULL,
	"landlord_name" text,
	"landlord_phone" text,
	"verified_by_ambassador" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "marketplace_listing" ADD COLUMN "bulk_min_qty" integer;--> statement-breakpoint
ALTER TABLE "marketplace_listing" ADD COLUMN "bulk_price" integer;--> statement-breakpoint
ALTER TABLE "marketplace_transaction" ADD COLUMN "waybill_details" text;--> statement-breakpoint
ALTER TABLE "marketplace_transaction" ADD COLUMN "shipped_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "government_id_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "government_id_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "market_recipient_code" text;--> statement-breakpoint
ALTER TABLE "parkout_ambassador" ADD CONSTRAINT "parkout_ambassador_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parkout_ambassador_application" ADD CONSTRAINT "parkout_ambassador_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parkout_inspection" ADD CONSTRAINT "parkout_inspection_listing_id_parkout_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."parkout_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parkout_inspection" ADD CONSTRAINT "parkout_inspection_incoming_user_id_user_id_fk" FOREIGN KEY ("incoming_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parkout_listing" ADD CONSTRAINT "parkout_listing_outgoing_user_id_user_id_fk" FOREIGN KEY ("outgoing_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parkout_listing" ADD CONSTRAINT "parkout_listing_ambassador_id_parkout_ambassador_id_fk" FOREIGN KEY ("ambassador_id") REFERENCES "public"."parkout_ambassador"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parkout_ambassador_userId_idx" ON "parkout_ambassador" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "parkout_ambassador_lga_idx" ON "parkout_ambassador" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "parkout_ambassador_status_idx" ON "parkout_ambassador" USING btree ("status");--> statement-breakpoint
CREATE INDEX "parkout_amb_app_userId_idx" ON "parkout_ambassador_application" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "parkout_amb_app_status_idx" ON "parkout_ambassador_application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "parkout_amb_app_lga_idx" ON "parkout_ambassador_application" USING btree ("territory_lga");--> statement-breakpoint
CREATE INDEX "parkout_inspection_listingId_idx" ON "parkout_inspection" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "parkout_inspection_incomingUser_idx" ON "parkout_inspection" USING btree ("incoming_user_id");--> statement-breakpoint
CREATE INDEX "parkout_inspection_status_idx" ON "parkout_inspection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "parkout_inspection_lockExpires_idx" ON "parkout_inspection" USING btree ("lock_expires_at");--> statement-breakpoint
CREATE INDEX "parkout_listing_outgoingUser_idx" ON "parkout_listing" USING btree ("outgoing_user_id");--> statement-breakpoint
CREATE INDEX "parkout_listing_ambassador_idx" ON "parkout_listing" USING btree ("ambassador_id");--> statement-breakpoint
CREATE INDEX "parkout_listing_status_idx" ON "parkout_listing" USING btree ("status");--> statement-breakpoint
CREATE INDEX "parkout_listing_lga_idx" ON "parkout_listing" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "parkout_listing_moveOut_idx" ON "parkout_listing" USING btree ("move_out_date");--> statement-breakpoint
ALTER TABLE "booking" DROP COLUMN "last_admin_alert";--> statement-breakpoint
ALTER TABLE "booking" DROP COLUMN "visit_date";--> statement-breakpoint
ALTER TABLE "booking" DROP COLUMN "preferred_period";--> statement-breakpoint
ALTER TABLE "booking" DROP COLUMN "visit_note";--> statement-breakpoint
ALTER TABLE "marketplace_listing" DROP COLUMN "waybill_details";--> statement-breakpoint
ALTER TABLE "marketplace_listing" DROP COLUMN "shipped_at";--> statement-breakpoint
ALTER TABLE "marketplace_transaction" DROP COLUMN "seller_rating";