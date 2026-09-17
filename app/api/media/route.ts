import { env } from "cloudflare:workers";
import { hasAdminSession } from "../../admin-auth";

async function canManage() { return hasAdminSession(); }
const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "application/pdf"]);

export async function GET(request: Request) {
  if (!(await canManage())) return Response.json({ error: "Administrator access required" }, { status: 403 });
  if (!env.DB) return Response.json({ error: "Media storage is unavailable" }, { status: 503 });
  const result = await env.DB.prepare("SELECT id, key, filename, content_type AS contentType, byte_size AS byteSize, created_at AS createdAt FROM media_assets ORDER BY created_at DESC LIMIT 100").all<Record<string, unknown>>();
  const assets = (result.results ?? []).map((asset) => ({ ...asset, url: new URL(`/api/media/${encodeURIComponent(String(asset.key))}`, request.url).toString() }));
  return Response.json({ assets }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await canManage())) return Response.json({ error: "Administrator access required" }, { status: 403 });
  if (!env.MEDIA || !env.DB) return Response.json({ error: "Media storage is unavailable" }, { status: 503 });
  const type = request.headers.get("content-type")?.split(";")[0] ?? "";
  const body = await request.arrayBuffer();
  const length = body.byteLength;
  if (!accepted.has(type) || !length || length > 20 * 1024 * 1024) return Response.json({ error: "Unsupported file or file exceeds the 20 MB upload limit" }, { status: 400 });
  const raw = new URL(request.url).searchParams.get("name") ?? "file";
  const name = raw.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${name}`;
  await env.MEDIA.put(key, body, { httpMetadata: { contentType: type } });
  await env.DB.prepare("INSERT INTO media_assets (id, key, filename, content_type, byte_size, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), key, name, type, length, new Date().toISOString()).run();
  return Response.json({ key, url: `/api/media/${encodeURIComponent(key)}` }, { status: 201 });
}
