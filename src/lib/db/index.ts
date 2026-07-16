import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/postgres';

const globalForDrizzle = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDrizzle.pool ?? new Pool({ connectionString: databaseUrl });
if (process.env.NODE_ENV !== 'production') globalForDrizzle.pool = pool;

export const db = drizzle(pool, { schema });
export type DB = typeof db;