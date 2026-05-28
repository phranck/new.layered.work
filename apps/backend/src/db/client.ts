import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { readEnv } from "../config/env";
import * as schema from "./schema";

export interface QueryClient {
  query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

export const sql = postgres(readEnv().databaseUrl);
export const db = drizzle(sql, { schema });

const queryClient: QueryClient = {
  async query<T>(text: string, values: unknown[] = []) {
    const rows = await sql.unsafe(text, values as never[]);
    return { rows: rows as unknown as T[] };
  },
};

export async function query<T>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await queryClient.query<T>(text, values);
  return result.rows;
}

export async function queryOne<T>(text: string, values: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] ?? null;
}

export async function transaction<T>(handler: (client: QueryClient) => Promise<T>): Promise<T> {
  const result = await sql.begin((transactionSql) =>
    handler({
      async query<R>(text: string, values: unknown[] = []) {
        const rows = await transactionSql.unsafe(text, values as never[]);
        return { rows: rows as unknown as R[] };
      },
    }),
  );
  return result as T;
}
