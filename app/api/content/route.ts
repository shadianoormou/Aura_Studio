import { env } from "cloudflare:workers";
import { hasAdminSession } from "../../admin-auth";

type RecordPayload = { id?: string; type?: string; title?: string; status?: string; position?: number; slug?: string; data?: unknown };

function now() { return new Date().toISOString(); }
function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { "cache-control": "no-store" } }); }
function database() { if (!env.DB) throw new Error("Database is not available yet."); return env.DB; }
function parseData(value: string) { try { return JSON.parse(value); } catch { return {}; } }
function normalise(row: Record<string, unknown>) { return { ...row, data: parseData(String(row.data ?? "{}")) }; }

async function adminAllowed() {
  return hasAdminSession();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const requestedStatus = url.searchParams.get("status");
    const isAdmin = await adminAllowed();
    const status = isAdmin ? requestedStatus : "published";
    if (!type) return json({ error: "type is required" }, 400);
    let statement = "SELECT id, type, slug, title, status, position, data, created_at AS createdAt, updated_at AS updatedAt FROM content_records WHERE type = ?";
    const values: string[] = [type];
    if (status) { statement += " AND status = ?"; values.push(status); }
    statement += " ORDER BY position ASC, updated_at DESC";
    const result = await database().prepare(statement).bind(...values).all<Record<string, unknown>>();
    return json({ records: (result.results ?? []).map(normalise) });
  } catch (error) { return json({ records: [], error: error instanceof Error ? error.message : "Content is unavailable" }, 503); }
}

export async function POST(request: Request) {
  if (!(await adminAllowed())) return json({ error: "Administrator access required" }, 403);
  try {
    const body = await request.json() as RecordPayload;
    const id = body.id?.trim() || crypto.randomUUID();
    const type = body.type?.trim();
    const title = body.title?.trim();
    const status = ["draft", "published", "unpublished"].includes(body.status ?? "") ? body.status! : "draft";
    if (!type || !title || type.length > 60 || title.length > 180) return json({ error: "A valid content type and title are required" }, 400);
    const timestamp = now();
    await database().prepare("INSERT INTO content_records (id, type, slug, title, status, position, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, type, body.slug?.trim() || null, title, status, Number.isFinite(body.position) ? body.position : 0, JSON.stringify(body.data ?? {}), timestamp, timestamp).run();
    return json({ record: { id, type, title, status, position: body.position ?? 0, data: body.data ?? {} } }, 201);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to save content" }, 500); }
}
