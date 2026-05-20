CREATE TABLE "visit_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visit_verification" ADD CONSTRAINT "visit_verification_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "visit_verification_bookingId_idx" ON "visit_verification" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "visit_verification_code_idx" ON "visit_verification" USING btree ("code");