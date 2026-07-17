import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`ALTER TABLE schedules DROP COLUMN jours_actifs;`);
    console.log('Dropped jours_actifs');
  } catch(e) { console.log(e); }
  
  try {
    await db.execute(sql`ALTER TABLE schedules ADD COLUMN date_voyage VARCHAR(10) NOT NULL DEFAULT '2026-07-17';`);
    console.log('Added date_voyage');
  } catch(e) { console.log(e); }
  
  try {
    await db.execute(sql`CREATE UNIQUE INDEX bus_date_time_idx ON schedules (bus_id, date_voyage, heure_depart);`);
    console.log('Created index');
  } catch(e) { console.log(e); }
  
  console.log('Done');
  process.exit(0);
}

main().catch(console.error);
