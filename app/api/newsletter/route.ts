import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";
import { saveNewsletterSignup } from "@/lib/newsletter";

const MAX_EMAIL_LENGTH = 254;

const NEWSLETTER_RATE_LIMIT_MAX = 4;
const NEWSLETTER_RATE_LIMIT_WINDOW_MS = 20 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const newsletterRateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function checkNewsletterRateLimit(request: NextRequest) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `newsletter:${ip}`;

  const existing = newsletterRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry = {
      count: 1,
      resetAt: now + NEWSLETTER_RATE_LIMIT_WINDOW_MS,
    };

    newsletterRateLimitStore.set(key, nextEntry);

    return {
      allowed: true,
      remaining: NEWSLETTER_RATE_LIMIT_MAX - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= NEWSLETTER_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  newsletterRateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: NEWSLETTER_RATE_LIMIT_MAX - existing.count,
    resetAt: existing.resetAt,
  };
}

export async function POST(request: NextRequest) {
  const rateLimit = checkNewsletterRateLimit(request);

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    );

    return NextResponse.json(
      { error: "Too many signup attempts. Please wait a little and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const email = sanitizeEmailInput(String(body?.email || ""));
  const honeypot = String(body?.website || "").trim();

  if (honeypot) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email." },
      { status: 400 }
    );
  }

  try {
    const result = await saveNewsletterSignup({
      email,
      source: "site_newsletter",
    });

    if (!result.saved) {
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your email has been added.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to save newsletter signup:", error);

    return NextResponse.json(
      { error: "Failed to save newsletter signup." },
      { status: 500 }
    );
  }
}