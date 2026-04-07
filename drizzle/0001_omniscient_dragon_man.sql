CREATE TABLE "score_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"total_score" real NOT NULL,
	"dimension_scores" jsonb NOT NULL,
	"scored_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "score_history" ADD CONSTRAINT "score_history_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "score_history_profile_id_idx" ON "score_history" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "score_history_scored_at_idx" ON "score_history" USING btree ("scored_at");