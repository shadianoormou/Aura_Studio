import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { "cache-control": "no-store" } }); }
async function canManage() { const user = await getChatGPTUser(); const emails = (env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()); return !!user && (user.email.endsWith("@sites.test") || emails.includes(user.email.toLowerCase())); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManage())) return json({ error: "Administrator access required" }, 403);
  try {
    const { id } = await context.params;
    const body = await request.json() as { status?: string; position?: number };
    if (!id || !["draft", "published", "unpublished"].includes(body.status ?? "")) return json({ error: "A valid status is required" }, 400);
    if (!env.DB) return json({ error: "Database unavailable" }, 503);
    await env.DB.prepare("UPDATE content_records SET status = ?, position = COALESCE(?, position), updated_at = ? WHERE id = ?").bind(body.status, Number.isFinite(body.position) ? body.position : null, new Date().toISOString(), id).run();
    return json({ ok: true });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to update content" }, 500); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManage())) return json({ error: "Administrator access required" }, 403);
  const { id } = await context.params;
  if (!env.DB) return json({ error: "Database unavailable" }, 503);
  await env.DB.prepare("UPDATE content_records SET status = 'unpublished', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  return json({ ok: true });
}
