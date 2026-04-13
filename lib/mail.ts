import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 465);

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendIssueReportEmail(params: {
  email: string;
  newsletterOptIn: boolean;
  issueText: string;
  opportunityTitle: string;
  opportunityId: string | number;
}) {
  const { email, newsletterOptIn, issueText, opportunityTitle, opportunityId } =
    params;

  const to = process.env.REPORT_ISSUE_TO;
  const from = process.env.EMAIL_FROM;

  if (!to) {
    throw new Error("Missing REPORT_ISSUE_TO in environment variables.");
  }

  if (!from) {
    throw new Error("Missing EMAIL_FROM in environment variables.");
  }

  await transporter.sendMail({
    from,
    to,
    subject: `TeenOpportunities issue report: ${
      opportunityTitle || "Untitled opportunity"
    }`,
    text: [
      "TeenOpportunities issue report",
      "",
      `Opportunity title: ${opportunityTitle || "Untitled opportunity"}`,
      `Opportunity ID: ${String(opportunityId)}`,
      `Reporter email: ${email}`,
      `Newsletter opt-in: ${newsletterOptIn ? "Yes" : "No"}`,
      "",
      "Issue report:",
      issueText,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>TeenOpportunities issue report</h2>
        <p><strong>Opportunity title:</strong> ${escapeHtml(
          opportunityTitle || "Untitled opportunity"
        )}</p>
        <p><strong>Opportunity ID:</strong> ${escapeHtml(
          String(opportunityId)
        )}</p>
        <p><strong>Reporter email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Newsletter opt-in:</strong> ${
          newsletterOptIn ? "Yes" : "No"
        }</p>
        <p><strong>Issue report:</strong></p>
        <div style="white-space: pre-wrap;">${escapeHtml(issueText)}</div>
      </div>
    `,
  });
}