import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type Db = ReturnType<typeof drizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: Db;
};

function getPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }

  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");

  // Remove sslmode from the URL so the explicit ssl option below is used.
  const url = new URL(raw);
  url.searchParams.delete("sslmode");

  const pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 1, // serverless: keep connections per instance low
  });

  globalForDb.__arenaNextJsPostgresqlPool = pool;
  return pool;
}

function getDb(): Db {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(getPool());
  }
  return globalForDb.__arenaNextJsPostgresqlDb;
}

// Lazy: nothing connects or checks env vars until first real use,
// so `next build` no longer fails when DATABASE_URL is missing.
export const pool = new Proxy({} as Pool, {
  get(_t, prop) {
    const p = getPool();
    const v = Reflect.get(p, prop, p);
    return typeof v === "function" ? v.bind(p) : v;
  },
});

export const db = new Proxy({} as Db, {
  get(_t, prop) {
    const d = getDb();
    const v = Reflect.get(d, prop, d);
    return typeof v === "function" ? v.bind(d) : v;
  },
});
