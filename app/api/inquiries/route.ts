import { env } from "cloudflare:workers";
import { hasAdminSession } from "../../admin-auth";

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
    let emailSent = false;
    if (env.RESEND_API_KEY) {
      const recipient = env.CONTACT_EMAIL || "shadia.creates@gmail.com";
      const from = env.CONTACT_FROM_EMAIL || "Aura Studio <onboarding@resend.dev>";
      const mail = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to: [recipient],
          reply_to: email,
          subject: `New Aura Studio inquiry from ${name}`,
          text: [`Name: ${name}`, `Brand: ${brand || "—"}`, `Email: ${email}`, `Project: ${projectType || "—"}`, "", message].join("\n"),
        }),
      });
      emailSent = mail.ok;
    }
    return Response.json({ accepted: true, emailSent }, { status: 201 });
  } catch { return Response.json({ error: "We could not send that inquiry. Please try again." }, { status: 500 }); }
}

export async function GET() {
  if (!(await hasAdminSession())) return Response.json({ error: "Administrator access required" }, { status: 403 });
  try {
    if (!env.DB) return Response.json({ inquiries: [] });
    const result = await env.DB.prepare("SELECT id, name, brand, email, project_type AS projectType, message, status, created_at AS createdAt FROM contact_inquiries ORDER BY created_at DESC LIMIT 100").all();
    return Response.json({ inquiries: result.results ?? [] }, { headers: { "cache-control": "no-store" } });
  } catch { return Response.json({ error: "Inquiries are unavailable" }, { status: 503 }); }
}
