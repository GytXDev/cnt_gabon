import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`DROP TABLE IF EXISTS chat_messages CASCADE;`;
    console.log("Dropped chat_messages");
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);
