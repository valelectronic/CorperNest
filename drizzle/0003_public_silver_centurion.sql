CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_agent_id_user_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_agentId_idx" ON "review" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "review_reviewerId_idx" ON "review" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "review_bookingId_idx" ON "review" USING btree ("booking_id");