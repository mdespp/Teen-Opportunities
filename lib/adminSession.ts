import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "teen_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  role: "admin";
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or too short. Use a long random string."
    );
  }

  return secret;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signValue(value: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("hex");
}

function timingSafeEqualString(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function createAdminSession() {
  const payload: AdminSessionPayload = {
    role: "admin",
    exp: Date.now() + SESSION_TTL_MS,
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadString);
  const signature = signValue(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function isAdminAuthenticated() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return false;
    }

    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      return false;
    }

    const expectedSignature = signValue(encodedPayload);

    if (!timingSafeEqualString(signature, expectedSignature)) {
      return false;
    }

    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as AdminSessionPayload;

    if (payload.role !== "admin") {
      return false;
    }

    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isValidAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || expected.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD is missing or too short. Use a strong password."
    );
  }

  const providedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}