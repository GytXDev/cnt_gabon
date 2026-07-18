import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"sender_id" uuid,
	"sender_nom" varchar(200),
	"contenu" text NOT NULL,
	"lu" boolean DEFAULT false,
	"actif" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);`;
    await sql`ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;`;
    await sql`ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;`;
    await sql`CREATE INDEX "chat_schedule_idx" ON "chat_messages" USING btree ("schedule_id","created_at");`;

    console.log("Created chat_messages");
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);
