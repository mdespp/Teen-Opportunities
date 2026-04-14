import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";
import { transporter } from "@/lib/mail";
import { saveNewsletterSignup } from "@/lib/newsletter";

type ApplicationDeadlineMode = "rolling" | "set_date";
type ProgramTimingMode = "set_date" | "label";

const MAX_EMAIL_LENGTH = 254;
const MAX_HONEYPOT_LENGTH = 200;

const SUBMIT_RATE_LIMIT_MAX = 5;
const SUBMIT_RATE_LIMIT_WINDOW_MS = 20 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const submitRateLimitStore = new Map<string, RateLimitEntry>();

function sanitizeSingleLineText(input: unknown, maxLength = 500) {
  return String(input ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultilineText(input: unknown, maxLength = 4000) {
  return String(input ?? "")
    .replace(/\r/g, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function sanitizeUrl(input: unknown) {
  return String(input ?? "")
    .replace(/[\r\n]+/g, "")
    .trim()
    .slice(0, 2000);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isApplicationDeadlineMode(
  value: unknown
): value is ApplicationDeadlineMode {
  return value === "rolling" || value === "set_date";
}

function isProgramTimingMode(value: unknown): value is ProgramTimingMode {
  return value === "set_date" || value === "label";
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

function checkSubmitRateLimit(request: NextRequest) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `submit:${ip}`;

  const existing = submitRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    const nextEntry = {
      count: 1,
      resetAt: now + SUBMIT_RATE_LIMIT_WINDOW_MS,
    };

    submitRateLimitStore.set(key, nextEntry);

    return {
      allowed: true,
      remaining: SUBMIT_RATE_LIMIT_MAX - 1,
      resetAt: nextEntry.resetAt,
    };
  }

  if (existing.count >= SUBMIT_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  submitRateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: SUBMIT_RATE_LIMIT_MAX - existing.count,
    resetAt: existing.resetAt,
  };
}

export async function POST(request: NextRequest) {
  const rateLimit = checkSubmitRateLimit(request);

  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    );

    return NextResponse.json(
      {
        error: "Too many submission attempts. Please wait a little and try again.",
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

  const submitterEmail = sanitizeEmailInput(
    String(body?.submitterEmail || "")
  );
  const submitterName = sanitizeSingleLineText(body?.submitterName, 120);
  const organizationName = sanitizeSingleLineText(
    body?.organizationName,
    160
  );
  const title = sanitizeSingleLineText(body?.title, 200);
  const website = sanitizeUrl(body?.website);
  const location = sanitizeSingleLineText(body?.location, 160);
  const type = sanitizeSingleLineText(body?.type, 80);
  const newsletterOptIn = Boolean(body?.newsletterOptIn);
  const honeypot = String(body?.contactWebsite || "").trim();

  const modality = Array.isArray(body?.modality)
    ? body.modality
        .map((v: unknown) => sanitizeSingleLineText(v, 50))
        .filter(Boolean)
    : [];

  const grades = Array.isArray(body?.grades)
    ? body.grades
        .map((v: unknown) => sanitizeSingleLineText(v, 50))
        .filter(Boolean)
    : [];

  const subjects = Array.isArray(body?.subjects)
    ? body.subjects
        .map((v: unknown) => sanitizeSingleLineText(v, 80))
        .filter(Boolean)
    : [];

  const cost = Array.isArray(body?.cost)
    ? body.cost
        .map((v: unknown) => sanitizeSingleLineText(v, 80))
        .filter(Boolean)
    : [];

  const days = Array.isArray(body?.days)
    ? body.days
        .map((v: unknown) => sanitizeSingleLineText(v, 50))
        .filter(Boolean)
    : [];

  const studentLed = Boolean(body?.studentLed);

  const applicationDeadlineModeRaw = body?.applicationDeadlineMode;
  const programStartModeRaw = body?.programStartMode;
  const programEndModeRaw = body?.programEndMode;

  if (honeypot && honeypot.length <= MAX_HONEYPOT_LENGTH) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  if (!isApplicationDeadlineMode(applicationDeadlineModeRaw)) {
    return NextResponse.json(
      { error: "Please choose how the application deadline is listed." },
      { status: 400 }
    );
  }

  if (!isProgramTimingMode(programStartModeRaw)) {
    return NextResponse.json(
      { error: "Please choose how the program start is listed." },
      { status: 400 }
    );
  }

  if (!isProgramTimingMode(programEndModeRaw)) {
    return NextResponse.json(
      { error: "Please choose how the program end is listed." },
      { status: 400 }
    );
  }

  const applicationDeadlineMode = applicationDeadlineModeRaw;
  const programStartMode = programStartModeRaw;
  const programEndMode = programEndModeRaw;

  const applicationDeadline = sanitizeSingleLineText(
    body?.applicationDeadline,
    30
  );
  const programStartDate = sanitizeSingleLineText(body?.programStartDate, 30);
  const programStartDateLabel = sanitizeSingleLineText(
    body?.programStartDateLabel,
    120
  );
  const programEndDate = sanitizeSingleLineText(body?.programEndDate, 30);
  const programEndDateLabel = sanitizeSingleLineText(
    body?.programEndDateLabel,
    120
  );

  const description = sanitizeMultilineText(body?.description, 4000);
  const imageUrl = sanitizeUrl(body?.imageUrl);
  const extraNotes = sanitizeMultilineText(body?.extraNotes, 2000);

  if (
    !submitterEmail ||
    submitterEmail.length > MAX_EMAIL_LENGTH ||
    !isValidEmail(submitterEmail)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json(
      { error: "Please enter a title." },
      { status: 400 }
    );
  }

  if (!website || !isValidHttpUrl(website)) {
    return NextResponse.json(
      { error: "Please enter a valid website or application link." },
      { status: 400 }
    );
  }

  if (!type) {
    return NextResponse.json(
      { error: "Please choose a type." },
      { status: 400 }
    );
  }

  if (!location) {
    return NextResponse.json(
      { error: "Please enter a location." },
      { status: 400 }
    );
  }

  if (modality.length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one modality." },
      { status: 400 }
    );
  }

  if (grades.length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one grade." },
      { status: 400 }
    );
  }

  if (subjects.length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one subject." },
      { status: 400 }
    );
  }

  if (cost.length === 0) {
    return NextResponse.json(
      { error: "Please choose at least one cost or pay option." },
      { status: 400 }
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: "Please enter a description." },
      { status: 400 }
    );
  }

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Please enter a valid image URL or leave it blank." },
      { status: 400 }
    );
  }

  if (applicationDeadlineMode === "set_date" && !applicationDeadline) {
    return NextResponse.json(
      { error: "Please choose an application deadline date." },
      { status: 400 }
    );
  }

  if (programStartMode === "set_date" && !programStartDate) {
    return NextResponse.json(
      { error: "Please choose a program start date." },
      { status: 400 }
    );
  }

  if (programStartMode === "label" && !programStartDateLabel) {
    return NextResponse.json(
      { error: "Please enter a program start label." },
      { status: 400 }
    );
  }

  if (programEndMode === "set_date" && !programEndDate) {
    return NextResponse.json(
      { error: "Please choose a program end date." },
      { status: 400 }
    );
  }

  if (programEndMode === "label" && !programEndDateLabel) {
    return NextResponse.json(
      { error: "Please enter a program end label." },
      { status: 400 }
    );
  }

  const resolvedApplicationDeadline =
    applicationDeadlineMode === "rolling"
      ? "Rolling basis"
      : applicationDeadline;

  const resolvedProgramStart =
    programStartMode === "set_date" ? programStartDate : programStartDateLabel;

  const resolvedProgramEnd =
    programEndMode === "set_date" ? programEndDate : programEndDateLabel;

  const submissionJson = {
    id: null,
    type,
    title,
    location,
    modality,
    applicationDeadline:
      applicationDeadlineMode === "set_date" ? applicationDeadline : "",
    applicationDeadlineLabel:
      applicationDeadlineMode === "rolling"
        ? "Rolling basis"
        : applicationDeadline,
    programStartDate:
      programStartMode === "set_date" ? programStartDate : "",
    programStartDateLabel:
      programStartMode === "set_date"
        ? programStartDate
        : programStartDateLabel,
    programEndDate: programEndMode === "set_date" ? programEndDate : "",
    programEndDateLabel:
      programEndMode === "set_date" ? programEndDate : programEndDateLabel,
    days,
    grades,
    subjects,
    cost,
    image: "",
    link: website,
    description,
    createdAt: "",
    connectedUsers: [],
    studentLed,
    submitterEmail,
    submitterName: submitterName || "",
    organizationName: organizationName || "",
    imageUrl: imageUrl || "",
    extraNotes: extraNotes || "",
  };

  const submissionJsonString = JSON.stringify(submissionJson, null, 2);

  const to = process.env.REPORT_ISSUE_TO || process.env.EMAIL_FROM;
  const from = process.env.EMAIL_FROM;

  if (!to) {
    throw new Error(
      "Missing REPORT_ISSUE_TO or EMAIL_FROM in environment variables."
    );
  }

  if (!from) {
    throw new Error("Missing EMAIL_FROM in environment variables.");
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `TeenOpportunities submission review: ${title}`,
      text: [
        "TeenOpportunities opportunity submission",
        "",
        `Submitter email: ${submitterEmail}`,
        `Submitter name: ${submitterName || "N/A"}`,
        `Organization name: ${organizationName || "N/A"}`,
        "",
        `Title: ${title}`,
        `Website: ${website}`,
        `Location: ${location}`,
        `Type: ${type}`,
        `Modality: ${modality.join(", ") || "N/A"}`,
        `Grades: ${grades.join(", ") || "N/A"}`,
        `Subjects: ${subjects.join(", ") || "N/A"}`,
        `Cost: ${cost.join(", ") || "N/A"}`,
        `Days: ${days.join(", ") || "N/A"}`,
        `Student-led: ${studentLed ? "Yes" : "No"}`,
        `Application deadline: ${resolvedApplicationDeadline}`,
        `Program start: ${resolvedProgramStart}`,
        `Program end: ${resolvedProgramEnd}`,
        `Image URL: ${imageUrl || "N/A"}`,
        "",
        "Description:",
        description,
        "",
        "Extra notes:",
        extraNotes || "N/A",
        "",
        "JSON version:",
        submissionJsonString,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>TeenOpportunities opportunity submission</h2>

          <p><strong>Submitter email:</strong> ${escapeHtml(submitterEmail)}</p>
          <p><strong>Submitter name:</strong> ${escapeHtml(
            submitterName || "N/A"
          )}</p>
          <p><strong>Organization name:</strong> ${escapeHtml(
            organizationName || "N/A"
          )}</p>

          <hr style="margin: 20px 0;" />

          <p><strong>Title:</strong> ${escapeHtml(title)}</p>
          <p><strong>Website:</strong> ${escapeHtml(website)}</p>
          <p><strong>Location:</strong> ${escapeHtml(location)}</p>
          <p><strong>Type:</strong> ${escapeHtml(type)}</p>
          <p><strong>Modality:</strong> ${escapeHtml(
            modality.join(", ") || "N/A"
          )}</p>
          <p><strong>Grades:</strong> ${escapeHtml(grades.join(", ") || "N/A")}</p>
          <p><strong>Subjects:</strong> ${escapeHtml(
            subjects.join(", ") || "N/A"
          )}</p>
          <p><strong>Cost:</strong> ${escapeHtml(cost.join(", ") || "N/A")}</p>
          <p><strong>Days:</strong> ${escapeHtml(days.join(", ") || "N/A")}</p>
          <p><strong>Student-led:</strong> ${studentLed ? "Yes" : "No"}</p>
          <p><strong>Application deadline:</strong> ${escapeHtml(
            resolvedApplicationDeadline
          )}</p>
          <p><strong>Program start:</strong> ${escapeHtml(
            resolvedProgramStart
          )}</p>
          <p><strong>Program end:</strong> ${escapeHtml(
            resolvedProgramEnd
          )}</p>
          <p><strong>Image URL:</strong> ${escapeHtml(imageUrl || "N/A")}</p>

          <p><strong>Description:</strong></p>
          <div style="white-space: pre-wrap;">${escapeHtml(description)}</div>

          <p style="margin-top: 16px;"><strong>Extra notes:</strong></p>
          <div style="white-space: pre-wrap;">${escapeHtml(
            extraNotes || "N/A"
          )}</div>

          <p style="margin-top: 16px;"><strong>JSON version:</strong></p>
          <pre style="white-space: pre-wrap; word-break: break-word; background: #f6f6f6; padding: 12px; border-radius: 8px;">${escapeHtml(
            submissionJsonString
          )}</pre>
        </div>
      `,
    });

    if (newsletterOptIn) {
      await saveNewsletterSignup({
        email: submitterEmail,
        source: "opportunity_submission",
      });
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to submit opportunity:", error);

    return NextResponse.json(
      { error: "Failed to submit opportunity." },
      { status: 500 }
    );
  }
}