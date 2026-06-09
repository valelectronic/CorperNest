CREATE TABLE "agent_kyc_request" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"state" text NOT NULL,
	"lga" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"renter_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"paystack_ref" text,
	"amount" integer DEFAULT 500000 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_split" (
	"id" text PRIMARY KEY NOT NULL,
	"inspection_payment_id" text NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_id" text,
	"amount" integer NOT NULL,
	"percentage" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" text PRIMARY KEY NOT NULL,
	"inspection_payment_id" text NOT NULL,
	"referring_agent_id" text NOT NULL,
	"receiving_agent_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"renter_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing" ALTER COLUMN "status" SET DEFAULT 'under-review';--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "inspection_payment_id" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "renter_contact" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "renter_contact_type" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "confirmation_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "agreed_date" timestamp;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "agreed_time" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "last_admin_alert" timestamp;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "preferred_period" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "visit_note" text;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "listing_purpose" text DEFAULT 'rent' NOT NULL;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "amenities" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "custom_amenities" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "agent_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_kyc_request" ADD CONSTRAINT "agent_kyc_request_agent_id_user_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_payment" ADD CONSTRAINT "inspection_payment_renter_id_user_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_payment" ADD CONSTRAINT "inspection_payment_agent_id_user_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_split" ADD CONSTRAINT "payout_split_inspection_payment_id_inspection_payment_id_fk" FOREIGN KEY ("inspection_payment_id") REFERENCES "public"."inspection_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_split" ADD CONSTRAINT "payout_split_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_inspection_payment_id_inspection_payment_id_fk" FOREIGN KEY ("inspection_payment_id") REFERENCES "public"."inspection_payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referring_agent_id_user_id_fk" FOREIGN KEY ("referring_agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_receiving_agent_id_user_id_fk" FOREIGN KEY ("receiving_agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_renter_id_user_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kyc_agentId_idx" ON "agent_kyc_request" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "kyc_status_idx" ON "agent_kyc_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inspection_payment_renterId_idx" ON "inspection_payment" USING btree ("renter_id");--> statement-breakpoint
CREATE INDEX "inspection_payment_agentId_idx" ON "inspection_payment" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "inspection_payment_status_idx" ON "inspection_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_user_read_idx" ON "notification" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "notification_createdAt_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payout_split_inspectionPaymentId_idx" ON "payout_split" USING btree ("inspection_payment_id");--> statement-breakpoint
CREATE INDEX "payout_split_recipientId_idx" ON "payout_split" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "payout_split_status_idx" ON "payout_split" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referral_inspectionPaymentId_idx" ON "referral" USING btree ("inspection_payment_id");--> statement-breakpoint
CREATE INDEX "referral_referringAgentId_idx" ON "referral" USING btree ("referring_agent_id");--> statement-breakpoint
CREATE INDEX "referral_receivingAgentId_idx" ON "referral" USING btree ("receiving_agent_id");--> statement-breakpoint
CREATE INDEX "watchlist_renterId_idx" ON "watchlist" USING btree ("renter_id");--> statement-breakpoint
CREATE INDEX "watchlist_listingId_idx" ON "watchlist" USING btree ("listing_id");--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_inspection_payment_id_inspection_payment_id_fk" FOREIGN KEY ("inspection_payment_id") REFERENCES "public"."inspection_payment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_confirmationStatus_idx" ON "booking" USING btree ("confirmation_status");--> statement-breakpoint
CREATE INDEX "booking_inspectionPaymentId_idx" ON "booking" USING btree ("inspection_payment_id");--> statement-breakpoint
CREATE INDEX "listing_purpose_idx" ON "listing" USING btree ("listing_purpose");