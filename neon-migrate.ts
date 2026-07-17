import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    await sql`ALTER TABLE schedules ALTER COLUMN jours_actifs SET DEFAULT '[]'::jsonb`;
    await sql`ALTER TABLE schedules ALTER COLUMN jours_actifs DROP NOT NULL`;
    console.log("jours_actifs updated");
  } catch (e) {
    console.error("jours_actifs update error:", e);
  }
  
  try {
    await sql`ALTER TABLE schedules ADD COLUMN date_voyage VARCHAR(10) NOT NULL DEFAULT '2026-07-17'`;
    console.log("date_voyage added");
  } catch (e) {
    console.error("date_voyage error:", e);
  }
  
  try {
    await sql`CREATE UNIQUE INDEX bus_date_time_idx ON schedules (bus_id, date_voyage, heure_depart)`;
    console.log("index added");
  } catch (e) {
    console.error("index error:", e);
  }
  
  console.log("Done");
}

main().catch(console.error);
