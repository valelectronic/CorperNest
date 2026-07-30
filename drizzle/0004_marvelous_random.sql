CREATE TABLE "booking_request" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"terms_accepted_at" timestamp NOT NULL,
	"approved_at" timestamp,
	"approved_by" text,
	"decline_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_listing" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"listing_type" text DEFAULT 'single' NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"description" text NOT NULL,
	"bundle_items" text[] DEFAULT '{}',
	"price" integer NOT NULL,
	"state" text NOT NULL,
	"lga" text NOT NULL,
	"landmark" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"has_receipt" boolean DEFAULT false,
	"seller_price_note" text,
	"ref_price_min" integer,
	"ref_price_max" integer,
	"ref_price_source" text,
	"ref_price_context" text,
	"ref_price_google_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"agreement_accepted_at" timestamp,
	"approved_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_report" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"transaction_id" text,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"amount" integer NOT NULL,
	"commission" integer NOT NULL,
	"seller_payout" integer NOT NULL,
	"paystack_ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"seller_rating" integer,
	"paid_at" timestamp,
	"confirmed_at" timestamp,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_vendor_kyc" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"id_type" text NOT NULL,
	"id_number" text NOT NULL,
	"id_photo_url" text NOT NULL,
	"selfie_url" text NOT NULL,
	"what_you_sell" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_request" (
	"id" text PRIMARY KEY NOT NULL,
	"renter_id" text NOT NULL,
	"lga" text NOT NULL,
	"state" text NOT NULL,
	"type" text NOT NULL,
	"listing_purpose" text DEFAULT 'rent' NOT NULL,
	"landmark" text,
	"min_budget" integer,
	"max_budget" integer,
	"notes" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "rent_record" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"renter_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"rent_amount" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"payment_date" timestamp NOT NULL,
	"renewal_date" timestamp NOT NULL,
	"receipt_url" text NOT NULL,
	"receipt_status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"paystack_ref" text,
	"fee_paid" boolean DEFAULT false NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_match" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"rejection_reason" text,
	"note" text,
	"matched_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "commission_status" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "commission_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "inspection_payment" ADD COLUMN "listing_id" text;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "landmark" text;--> statement-breakpoint
ALTER TABLE "listing" ADD COLUMN "agency_fee_percent" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone_number_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "market_account_number" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "market_bank_code" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "market_account_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "market_seller_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "market_vendor_tier" text DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_client_id_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_request" ADD CONSTRAINT "booking_request_agent_id_user_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listing" ADD CONSTRAINT "marketplace_listing_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_report" ADD CONSTRAINT "marketplace_report_listing_id_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_report" ADD CONSTRAINT "marketplace_report_transaction_id_marketplace_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."marketplace_transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_report" ADD CONSTRAINT "marketplace_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_transaction" ADD CONSTRAINT "marketplace_transaction_listing_id_marketplace_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_transaction" ADD CONSTRAINT "marketplace_transaction_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_transaction" ADD CONSTRAINT "marketplace_transaction_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_vendor_kyc" ADD CONSTRAINT "marketplace_vendor_kyc_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_request" ADD CONSTRAINT "property_request_renter_id_user_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_record" ADD CONSTRAINT "rent_record_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_record" ADD CONSTRAINT "rent_record_renter_id_user_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_record" ADD CONSTRAINT "rent_record_agent_id_user_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_record" ADD CONSTRAINT "rent_record_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_match" ADD CONSTRAINT "request_match_request_id_property_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."property_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_match" ADD CONSTRAINT "request_match_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_match" ADD CONSTRAINT "request_match_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_request_clientId_idx" ON "booking_request" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "booking_request_listingId_idx" ON "booking_request" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "booking_request_agentId_idx" ON "booking_request" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "booking_request_status_idx" ON "booking_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "market_listing_sellerId_idx" ON "marketplace_listing" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "market_listing_status_idx" ON "marketplace_listing" USING btree ("status");--> statement-breakpoint
CREATE INDEX "market_listing_category_idx" ON "marketplace_listing" USING btree ("category");--> statement-breakpoint
CREATE INDEX "market_listing_state_idx" ON "marketplace_listing" USING btree ("state");--> statement-breakpoint
CREATE INDEX "market_listing_lga_idx" ON "marketplace_listing" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "market_listing_type_idx" ON "marketplace_listing" USING btree ("listing_type");--> statement-breakpoint
CREATE INDEX "market_report_listingId_idx" ON "marketplace_report" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "market_report_reporterId_idx" ON "marketplace_report" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "market_txn_listingId_idx" ON "marketplace_transaction" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "market_txn_buyerId_idx" ON "marketplace_transaction" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "market_txn_sellerId_idx" ON "marketplace_transaction" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "market_txn_status_idx" ON "marketplace_transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_kyc_userId_idx" ON "marketplace_vendor_kyc" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendor_kyc_status_idx" ON "marketplace_vendor_kyc" USING btree ("status");--> statement-breakpoint
CREATE INDEX "property_request_renterId_idx" ON "property_request" USING btree ("renter_id");--> statement-breakpoint
CREATE INDEX "property_request_status_idx" ON "property_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "property_request_lga_idx" ON "property_request" USING btree ("lga");--> statement-breakpoint
CREATE INDEX "push_sub_userId_idx" ON "push_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rent_record_renterId_idx" ON "rent_record" USING btree ("renter_id");--> statement-breakpoint
CREATE INDEX "rent_record_agentId_idx" ON "rent_record" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "rent_record_bookingId_idx" ON "rent_record" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "rent_record_renewalDate_idx" ON "rent_record" USING btree ("renewal_date");--> statement-breakpoint
CREATE INDEX "rent_record_receiptStatus_idx" ON "rent_record" USING btree ("receipt_status");--> statement-breakpoint
CREATE INDEX "request_match_requestId_idx" ON "request_match" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_match_listingId_idx" ON "request_match" USING btree ("listing_id");--> statement-breakpoint
ALTER TABLE "inspection_payment" ADD CONSTRAINT "inspection_payment_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number");