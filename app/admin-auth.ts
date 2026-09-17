import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

const COOKIE_NAME = "aura_admin_session";
const SESSION_MESSAGE = "aura-studio-admin-v1";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function configuredPin(): string | null {
  const pin = env.ADMIN_PIN?.trim();
  return pin || null;
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function base64Url(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function sessionToken() {
  const pin = configuredPin();
  if (!pin) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    bytes(pin),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, bytes(SESSION_MESSAGE));
  return `v1.${base64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminPin(pin: unknown) {
  const expected = configuredPin();
  if (!expected || typeof pin !== "string" || pin.length > 100) return false;
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", bytes(pin)),
    crypto.subtle.digest("SHA-256", bytes(expected)),
  ]);
  return equalBytes(new Uint8Array(left), new Uint8Array(right));
}

export async function hasAdminSession() {
  const token = await sessionToken();
  if (!token) return false;
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  return !!cookie && equalBytes(bytes(cookie), bytes(token));
}

export async function adminSessionCookie() {
  const token = await sessionToken();
  if (!token) return null;
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
