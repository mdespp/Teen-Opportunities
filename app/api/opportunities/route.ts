import { NextRequest, NextResponse } from "next/server";
import { getAllOpportunities } from "@/lib/opportunities";

const OPPORTUNITIES_RATE_LIMIT_MAX = 60;
const OPPORTUNITIES_RATE_LIMIT_WINDOW_MS = 20 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const opportunitiesRateLimitStore = new Map<string, RateLimitEntry>();

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

function checkOpportunitiesRateLimit(request: NextRequest) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `opportunities:${ip}`;

  const existing = opportunitiesRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry = {
      count: 1,
      resetAt: now + OPPORTUNITIES_RATE_LIMIT_WINDOW_MS,
    };

    opportunitiesRateLimitStore.set(key, nextEntry);

    return {
      allowed: true,
      remaining: OPPORTUNITIES_RATE_LIMIT_MAX - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= OPPORTUNITIES_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  opportunitiesRateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: OPPORTUNITIES_RATE_LIMIT_MAX - existing.count,
    resetAt: existing.resetAt,
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = checkOpportunitiesRateLimit(request);

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    );

    return NextResponse.json(
      {
        error: "Too many requests. Please wait a little and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      }
    );
  }

  try {
    const opportunities = await getAllOpportunities();

    return NextResponse.json(
      {
        opportunities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch opportunities.",
      },
      { status: 500 }
    );
  }
}