import { env } from "cloudflare:workers";

const string = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : "";

export async function POST(request: Request) {
  try {
    const data = await request.json() as Record<string, unknown>;
    const name = string(data.name, 120), brand = string(data.brand, 160), email = string(data.email, 180), projectType = string(data.projectType, 120), message = string(data.message, 4000);
    if (!name || !email.includes("@") || !message) return Response.json({ error: "Please complete the required fields." }, { status: 400 });
    if (!env.DB) return Response.json({ accepted: true, mode: "preview" }, { status: 202 });
    const timestamp = new Date().toISOString();
    await env.DB.prepare("INSERT INTO contact_inquiries (id, name, brand, email, project_type, message, status, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)")
      .bind(crypto.randomUUID(), name, brand || null, email, projectType || null, message, JSON.stringify(data), timestamp).run();
    return Response.json({ accepted: true }, { status: 201 });
  } catch { return Response.json({ error: "We could not send that inquiry. Please try again." }, { status: 500 }); }
}
