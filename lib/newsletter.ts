import clientPromise from "@/lib/mongodb";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";

const dbName = process.env.MONGODB_DB || "nychighschoolopportunities";
const newsletterCollectionName =
  process.env.MONGODB_NEWSLETTER_COLLECTION || "newsletter_signups";

const NEWSLETTER_DOC_ID = "newsletter_signups";

export type NewsletterSignupSource =
  | "report_issue"
  | "opportunity_submission"
  | "linkedin_post"
  | "site_newsletter";

type SaveNewsletterSignupParams = {
  email: string;
  source: NewsletterSignupSource;
  opportunityId?: string | number | null;
};

type NewsletterEntry = [string, string];

type NewsletterDoc = {
  _id: string;
  entries: NewsletterEntry[];
};

function buildAddedFrom(
  source: NewsletterSignupSource,
  opportunityId?: string | number | null
) {
  if (
    (source === "report_issue" || source === "linkedin_post") &&
    opportunityId !== null &&
    opportunityId !== undefined &&
    String(opportunityId).trim() !== ""
  ) {
    return `${source}:${String(opportunityId).trim()}`;
  }

  return source;
}

export async function saveNewsletterSignup({
  email,
  source,
  opportunityId = null,
}: SaveNewsletterSignupParams) {
  const cleanedEmail = sanitizeEmailInput(email);

  if (!cleanedEmail || !isValidEmail(cleanedEmail)) {
    return { saved: false, reason: "invalid_email" as const };
  }

  const addedFrom = buildAddedFrom(source, opportunityId);

  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection<NewsletterDoc>(newsletterCollectionName);

  const existingDoc = await collection.findOne({ _id: NEWSLETTER_DOC_ID });
  const entries = Array.isArray(existingDoc?.entries) ? existingDoc.entries : [];

  const nextEntries: NewsletterEntry[] = [
    ...entries,
    [cleanedEmail, addedFrom],
  ];

  await collection.replaceOne(
    { _id: NEWSLETTER_DOC_ID },
    {
      entries: nextEntries,
    },
    { upsert: true }
  );

  return { saved: true as const };
}