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

const DELETE_RATE_LIMIT_MAX = 5;
const DELETE_RATE_LIMIT_WINDOW_MS = 1 * 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const deleteRateLimitStore = new Map<string, RateLimitEntry>();

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

function checkDeleteRateLimit(request: NextRequest, opportunityId: string) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `delete:${opportunityId}:${ip}`;

  const existing = deleteRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry = {
      count: 1,
      resetAt: now + DELETE_RATE_LIMIT_WINDOW_MS,
    };

    deleteRateLimitStore.set(key, nextEntry);

    return {
      allowed: true,
      remaining: DELETE_RATE_LIMIT_MAX - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= DELETE_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  deleteRateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: DELETE_RATE_LIMIT_MAX - existing.count,
    resetAt: existing.resetAt,
  };
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
  return users.map(
    ({
      email: _email,
      deleteCode: _deleteCode,
      deleteCodeHash: _deleteCodeHash,
      newsletterOptIn: _newsletterOptIn,
      ...rest
    }) => rest
  );
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
    const body = await request.json();

    const rawLinkedinUrl = String(body?.linkedinUrl || "");
    const submittedName = sanitizeEditableName(String(body?.name || "").trim());
    const email = sanitizeEmailInput(String(body?.email || ""));
    const newsletterOptIn = Boolean(body?.newsletterOptIn);

    console.log("linkedin body newsletterOptIn:", body?.newsletterOptIn);
    console.log("linkedin parsed newsletterOptIn:", newsletterOptIn);

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid opportunity id." },
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

    if (!email) {
      return NextResponse.json(
        { error: "Please enter an email." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
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
      console.log("saving linkedin newsletter signup");

      await saveNewsletterSignup({
        email,
        source: "linkedin_post",
        opportunityId: resolvedOpportunityId,
      });

      console.log("linkedin newsletter signup saved");
    } else {
      console.log("linkedin newsletter signup skipped");
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

    const body = await request.json();

    const deleteCode = sanitizeDeleteCode(String(body?.deleteCode || ""));
    const deleteCodeHash = hashDeleteCode(deleteCode);

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid opportunity id." },
        { status: 400 }
      );
    }

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

    const updatedUsers = connectedUsers
      .filter((user) => user.id !== targetUser.id)
      .map(({ deleteCode, ...rest }) => rest);

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