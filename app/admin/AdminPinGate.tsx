"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "Could not unlock admin.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="admin-pin-shell">
    <form className="admin-pin-card" onSubmit={unlock}>
      <a className="wordmark" href="/">AURA<span>STUDIO</span></a>
      <p className="cms-kicker">Private admin</p>
      <h1>Enter your PIN</h1>
      <p>Use your 4-digit admin PIN to manage your website.</p>
      <label>
        Admin PIN
        <input
          autoComplete="current-password"
          autoFocus
          inputMode="numeric"
          maxLength={100}
          name="pin"
          onChange={(event) => setPin(event.target.value)}
          pattern="[0-9]*"
          required
          type="password"
          value={pin}
        />
      </label>
      {message && <p className="admin-pin-error" role="alert">{message}</p>}
      <button className="cms-primary" disabled={submitting} type="submit">
        {submitting ? "Checking…" : "Open admin"}
      </button>
      <a className="admin-back" href="/">← Back to website</a>
    </form>
  </main>;
}
