import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";
import { sendIssueReportEmail } from "@/lib/mail";
import { saveNewsletterSignup } from "@/lib/newsletter";

const dbName = process.env.MONGODB_DB || "nychighschoolopportunities";
const collectionName = process.env.MONGODB_COLLECTION || "opportunities";

function sanitizeIssueText(input: string) {
  return input.replace(/\r/g, "").slice(0, 2000);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const email = sanitizeEmailInput(String(body?.email || ""));
    const newsletterOptIn = Boolean(body?.newsletterOptIn);
    const issueText = sanitizeIssueText(String(body?.issueText || "")).trim();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid opportunity id." },
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

    if (!issueText) {
      return NextResponse.json(
        { error: "Please describe the issue." },
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
        reportedEmail: email,
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