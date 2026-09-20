/*
 * Vercel runtime adapter for the existing Cloudflare-shaped API routes.
 * Cloudflare Sites still uses its native `cloudflare:workers` module; this
 * file is only aliased by next.config.ts during a Vercel build.
 */
import { head, put } from "@vercel/blob";
import { sql } from "@vercel/postgres";

type QueryResult<T> = { results: T[] };

function postgresQuery(statement: string, values: unknown[]) {
  let index = 0;
  const query = statement.replace(/\?/g, () => `$${++index}`);
  return sql.query(query, values);
}

let schemaReady: Promise<void> | null = null;
async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql.query(`CREATE TABLE IF NOT EXISTS contact_inquiries (id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, email TEXT NOT NULL, project_type TEXT, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', payload TEXT NOT NULL, created_at TEXT NOT NULL)`);
      await sql.query(`CREATE TABLE IF NOT EXISTS content_records (id TEXT PRIMARY KEY, type TEXT NOT NULL, slug TEXT, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', position INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
      await sql.query(`CREATE TABLE IF NOT EXISTS media_assets (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, filename TEXT NOT NULL, content_type TEXT NOT NULL, byte_size INTEGER NOT NULL, created_at TEXT NOT NULL)`);
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_content_records_type_status_position ON content_records (type, status, position)`);
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status_created_at ON contact_inquiries (status, created_at)`);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

class PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly statement: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async all<T = Record<string, unknown>>(): Promise<QueryResult<T>> {
    await ensureSchema();
    const result = await postgresQuery(this.statement, this.values);
    return { results: result.rows as T[] };
  }

  async run() {
    await ensureSchema();
    await postgresQuery(this.statement, this.values);
    return { success: true };
  }
}

const database = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  ? { prepare: (statement: string) => new PreparedStatement(statement) }
  : undefined;

const media = process.env.BLOB_READ_WRITE_TOKEN
  ? {
      async put(key: string, body: ArrayBuffer, options: { httpMetadata?: { contentType?: string } } = {}) {
        return put(key, body, { access: "public", contentType: options.httpMetadata?.contentType });
      },
      async get(key: string) {
        const blob = await head(key);
        const response = await fetch(blob.url);
        if (!response.ok || !response.body) return null;
        return {
          body: response.body,
          httpEtag: blob.etag,
          writeHttpMetadata(headers: Headers) {
            if (blob.contentType) headers.set("content-type", blob.contentType);
          },
        };
      },
    }
  : undefined;

export const env = {
  DB: database,
  MEDIA: media,
  ADMIN_PIN: process.env.ADMIN_PIN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
};
