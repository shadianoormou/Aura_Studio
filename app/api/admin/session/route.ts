import {
  adminSessionCookie,
  clearAdminSessionCookie,
  verifyAdminPin,
} from "../../../admin-auth";

export async function POST(request: Request) {
  let pin: unknown;
  try {
    const body = await request.json() as { pin?: unknown };
    pin = body.pin;
  } catch {
    return Response.json({ error: "Enter your admin PIN." }, { status: 400 });
  }

  if (!(await verifyAdminPin(pin))) {
    return Response.json({ error: "That PIN is not correct." }, { status: 401 });
  }

  const cookie = await adminSessionCookie();
  if (!cookie) {
    return Response.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  return Response.json(
    { ok: true },
    { headers: { "set-cookie": cookie, "cache-control": "no-store" } },
  );
}

export async function DELETE() {
  return Response.json(
    { ok: true },
    { headers: { "set-cookie": clearAdminSessionCookie(), "cache-control": "no-store" } },
  );
}
