import { env } from "cloudflare:workers";
import { hasAdminSession } from "../../admin-auth";

async function canManage() { return hasAdminSession(); }
const accepted = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "application/pdf"]);

export async function POST(request: Request) {
  if (!(await canManage())) return Response.json({ error: "Administrator access required" }, { status: 403 });
  if (!env.MEDIA || !env.DB) return Response.json({ error: "Media storage is unavailable" }, { status: 503 });
  const type = request.headers.get("content-type")?.split(";")[0] ?? "";
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!accepted.has(type) || (length && length > 20 * 1024 * 1024)) return Response.json({ error: "Unsupported file or file exceeds the 20 MB direct upload limit" }, { status: 400 });
  const raw = new URL(request.url).searchParams.get("name") ?? "file";
  const name = raw.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${name}`;
  await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type } });
  await env.DB.prepare("INSERT INTO media_assets (id, key, filename, content_type, byte_size, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), key, name, type, length, new Date().toISOString()).run();
  return Response.json({ key, url: `/api/media/${encodeURIComponent(key)}` }, { status: 201 });
}
