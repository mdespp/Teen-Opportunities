import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { parseLinkedInProfileUrl } from "@/lib/linkedin";
import {
  isBlockedLinkedInSubmission,
  sanitizeEditableName,
} from "@/lib/nameModeration";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";
import { saveNewsletterSignup } from "@/lib/newsletter";

const dbName = process.env.MONGODB_DB || "nychighschoolopportunities";
const collectionName = process.env.MONGODB_COLLECTION || "opportunities";

const DELETE_RATE_LIMIT_MAX = 9;
const DELETE_RATE_LIMIT_WINDOW_MS = 20 * 1000;

const POST_RATE_LIMIT_MAX = 8;
const POST_RATE_LIMIT_WINDOW_MS = 20 * 1000;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_LINKEDIN_URL_LENGTH = 500;
const MAX_HONEYPOT_LENGTH = 200;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const deleteRateLimitStore = new Map<string, RateLimitEntry>();
const postRateLimitStore = new Map<string, RateLimitEntry>();

function sanitizeDeleteCode(input: string) {
  return input.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
}

function hashDeleteCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateDeleteCode(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
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

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  max: number,
  windowMs: number
) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry = {
      count: 1,
      resetAt: now + windowMs,
    };

    store.set(key, nextEntry);

    return {
      allowed: true,
      remaining: max - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
  };
}

function checkDeleteRateLimit(request: NextRequest, opportunityId: string) {
  const ip = getClientIp(request);
  return checkRateLimit(
    deleteRateLimitStore,
    `delete:${opportunityId}:${ip}`,
    DELETE_RATE_LIMIT_MAX,
    DELETE_RATE_LIMIT_WINDOW_MS
  );
}

function checkPostRateLimit(request: NextRequest, opportunityId: string) {
  const ip = getClientIp(request);
  return checkRateLimit(
    postRateLimitStore,
    `post:${opportunityId}:${ip}`,
    POST_RATE_LIMIT_MAX,
    POST_RATE_LIMIT_WINDOW_MS
  );
}

function normalizeConnectedUsers(value: any, docId: string) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((user: any, index: number) => ({
    id: String(user?.id || `${docId}-user-${index}`),
    name: String(user?.name || "").trim(),
    linkedinUrl: String(user?.linkedinUrl || "").trim(),
    image: "",
    email: String(user?.email || "").trim(),
    deleteCode: String(user?.deleteCode || "").trim(),
    deleteCodeHash: String(user?.deleteCodeHash || "").trim(),
    newsletterOptIn: Boolean(user?.newsletterOptIn),
  }));
}

function publicConnectedUsers(
  users: Array<{
    id: string;
    name: string;
    linkedinUrl: string;
    image?: string;
    email?: string;
    deleteCode?: string;
    deleteCodeHash?: string;
    newsletterOptIn?: boolean;
  }>
) {
  return users.map((user) => ({
    name: user.name,
    linkedinUrl: user.linkedinUrl,
  }));
}

function codeAlreadyExists(
  users: Array<{ deleteCode?: string; deleteCodeHash?: string }>,
  plainCode: string
) {
  const hashed = hashDeleteCode(plainCode);

  return users.some((user) => {
    if (user.deleteCodeHash && user.deleteCodeHash === hashed) {
      return true;
    }

    if (user.deleteCode && sanitizeDeleteCode(user.deleteCode) === plainCode) {
      return true;
    }

    return false;
  });
}

function generateUniqueDeleteCode(
  users: Array<{ deleteCode?: string; deleteCodeHash?: string }>
) {
  let code = generateDeleteCode(10);

  while (codeAlreadyExists(users, code)) {
    code = generateDeleteCode(10);
  }

  return code;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid opportunity id." },
        { status: 400 }
      );
    }

    const rateLimit = checkPostRateLimit(request, id);

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );

      return NextResponse.json(
        {
          error: "Too many post attempts. Please wait a little and try again.",
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

    const rawLinkedinUrl = String(body?.linkedinUrl || "").trim();
    const submittedName = sanitizeEditableName(String(body?.name || "").trim());
    const email = sanitizeEmailInput(String(body?.email || ""));
    const newsletterOptIn = Boolean(body?.newsletterOptIn);
    const honeypot = String(body?.website || "").trim();

    if (honeypot && honeypot.length <= MAX_HONEYPOT_LENGTH) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    if (!rawLinkedinUrl || rawLinkedinUrl.length > MAX_LINKEDIN_URL_LENGTH) {
      return NextResponse.json(
        { error: "Please enter a valid LinkedIn profile URL." },
        { status: 400 }
      );
    }

    if (submittedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: "Name is too long." },
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

    const parsed = parseLinkedInProfileUrl(rawLinkedinUrl);

    if (!parsed.isValid) {
      return NextResponse.json(
        { error: "Please enter a valid LinkedIn profile URL." },
        { status: 400 }
      );
    }

    const guessedName = sanitizeEditableName(parsed.name);
    const finalName = submittedName || guessedName;

    if (!finalName) {
      return NextResponse.json(
        { error: "Could not determine a valid name." },
        { status: 400 }
      );
    }

    if (finalName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: "Name is too long." },
        { status: 400 }
      );
    }

    if (
      isBlockedLinkedInSubmission({
        submittedName: finalName,
        guessedName,
        slug: parsed.slug,
      })
    ) {
      return NextResponse.json(
        { error: "That name cannot be used." },
        { status: 400 }
      );
    }

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

    const connectedUsers = normalizeConnectedUsers(existingDoc.connectedUsers, id);

    const alreadyExists = connectedUsers.some(
      (user) => user.linkedinUrl.toLowerCase() === parsed.cleanedUrl.toLowerCase()
    );

    if (alreadyExists) {
      return NextResponse.json(
        { error: "That LinkedIn profile is already posted." },
        { status: 409 }
      );
    }

    const deleteCode = generateUniqueDeleteCode(connectedUsers);
    const deleteCodeHash = hashDeleteCode(deleteCode);

    const newUser = {
      id: new ObjectId().toString(),
      name: finalName,
      linkedinUrl: parsed.cleanedUrl,
      image: "",
      email,
      deleteCodeHash,
      newsletterOptIn,
    };

    const updatedUsers = [...connectedUsers, newUser];

    await collection.updateOne(
      { _id },
      {
        $set: {
          connectedUsers: updatedUsers,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const resolvedOpportunityId =
      existingDoc.id !== undefined && existingDoc.id !== null
        ? existingDoc.id
        : id;

    if (newsletterOptIn) {
      await saveNewsletterSignup({
        email,
        source: "linkedin_post",
        opportunityId: resolvedOpportunityId,
      });
    }

    return NextResponse.json(
      {
        connectedUsers: publicConnectedUsers(updatedUsers),
        postedEmail: email,
        deleteCode,
        message:
          "Your LinkedIn was posted. Save your delete code somewhere safe. It will only be shown once.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to post LinkedIn:", error);

    return NextResponse.json(
      { error: "Failed to post LinkedIn." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid opportunity id." },
        { status: 400 }
      );
    }

    const rateLimit = checkDeleteRateLimit(request, id);

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );

      return NextResponse.json(
        {
          error:
            "Too many delete attempts. Please wait a little and try again.",
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

    const deleteCode = sanitizeDeleteCode(String(body?.deleteCode || ""));
    const deleteCodeHash = hashDeleteCode(deleteCode);

    if (deleteCode.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-character delete code." },
        { status: 400 }
      );
    }

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

    const connectedUsers = normalizeConnectedUsers(existingDoc.connectedUsers, id);

    const targetUser = connectedUsers.find((user) => {
      if (user.deleteCodeHash) {
        return user.deleteCodeHash === deleteCodeHash;
      }

      if (user.deleteCode) {
        return sanitizeDeleteCode(user.deleteCode) === deleteCode;
      }

      return false;
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            "Delete code does not match any posted entry in this opportunity.",
        },
        { status: 404 }
      );
    }

    const updatedUsers = connectedUsers.filter(
      (user) => user.id !== targetUser.id
    );

    await collection.updateOne(
      { _id },
      {
        $set: {
          connectedUsers: updatedUsers,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json(
      {
        connectedUsers: publicConnectedUsers(updatedUsers),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to remove LinkedIn:", error);

    return NextResponse.json(
      { error: "Failed to remove LinkedIn." },
      { status: 500 }
    );
  }
}