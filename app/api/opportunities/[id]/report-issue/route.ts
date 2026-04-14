import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";
import { sendIssueReportEmail } from "@/lib/mail";
import { saveNewsletterSignup } from "@/lib/newsletter";

const dbName = process.env.MONGODB_DB || "nychighschoolopportunities";
const collectionName = process.env.MONGODB_COLLECTION || "opportunities";

const MAX_EMAIL_LENGTH = 254;
const MAX_HONEYPOT_LENGTH = 200;
const MAX_ISSUE_TEXT_LENGTH = 2000;

const REPORT_RATE_LIMIT_MAX = 6;
const REPORT_RATE_LIMIT_WINDOW_MS = 20 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const reportRateLimitStore = new Map<string, RateLimitEntry>();

function sanitizeIssueText(input: string) {
  return input.replace(/\r/g, "").slice(0, MAX_ISSUE_TEXT_LENGTH);
}

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

function checkReportRateLimit(request: NextRequest, opportunityId: string) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `report:${opportunityId}:${ip}`;

  const existing = reportRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry = {
      count: 1,
      resetAt: now + REPORT_RATE_LIMIT_WINDOW_MS,
    };

    reportRateLimitStore.set(key, nextEntry);

    return {
      allowed: true,
      remaining: REPORT_RATE_LIMIT_MAX - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= REPORT_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  reportRateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: REPORT_RATE_LIMIT_MAX - existing.count,
    resetAt: existing.resetAt,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid opportunity id." },
      { status: 400 }
    );
  }

  const rateLimit = checkReportRateLimit(request, id);

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    );

    return NextResponse.json(
      {
        error: "Too many issue reports. Please wait a little and try again.",
      },
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
  const newsletterOptIn = Boolean(body?.newsletterOptIn);
  const issueText = sanitizeIssueText(String(body?.issueText || "")).trim();
  const honeypot = String(body?.website || "").trim();

  if (honeypot && honeypot.length <= MAX_HONEYPOT_LENGTH) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!email) {
    return NextResponse.json(
      { error: "Please enter an email." },
      { status: 400 }
    );
  }

  if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 }
    );
  }

  if (!issueText) {
    return NextResponse.json(
      { error: "Please describe the issue." },
      { status: 400 }
    );
  }

  if (issueText.length > MAX_ISSUE_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Issue description is too long." },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const _id = new ObjectId(id);
    const existingDoc = await collection.findOne({ _id });

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Opportunity not found." },
        { status: 404 }
      );
    }

    const resolvedOpportunityId =
      existingDoc.id !== undefined && existingDoc.id !== null
        ? existingDoc.id
        : id;

    await sendIssueReportEmail({
      email,
      newsletterOptIn,
      issueText,
      opportunityTitle: String(existingDoc.title || ""),
      opportunityId: resolvedOpportunityId,
    });

    if (newsletterOptIn) {
      await saveNewsletterSignup({
        email,
        source: "report_issue",
        opportunityId: resolvedOpportunityId,
      });
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to submit issue:", error);

    return NextResponse.json(
      { error: "Failed to submit issue." },
      { status: 500 }
    );
  }
}