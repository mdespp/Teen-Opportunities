"use client";

import { useEffect, useState } from "react";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";

type ReportIssueFormProps = {
  opportunityId: string | number;
  isSaving: boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

function sanitizeIssueText(input: string) {
  return input.replace(/\r/g, "").slice(0, 2000);
}

export default function ReportIssueForm({
  opportunityId,
  isSaving,
  onSuccess,
  onError,
  onCancel,
}: ReportIssueFormProps) {
  const [emailInput, setEmailInput] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isBusy = isSaving || isSubmittingLocal;

  useEffect(() => {
    if (!showSuccessModal) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSuccessModal(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showSuccessModal]);

  async function handleSubmit() {
    if (isBusy) return;

    const cleanedEmail = sanitizeEmailInput(emailInput);
    const cleanedIssueText = sanitizeIssueText(issueText).trim();

    if (!cleanedEmail) {
      onError("Please enter an email.");
      return;
    }

    if (!isValidEmail(cleanedEmail)) {
      onError("Please enter a valid email.");
      return;
    }

    if (!cleanedIssueText) {
      onError("Please describe the issue.");
      return;
    }

    try {
      setIsSubmittingLocal(true);
      onError("");

      const response = await fetch(
        `/api/opportunities/${opportunityId}/report-issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanedEmail,
            newsletterOptIn,
            issueText: cleanedIssueText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit issue.");
      }

      onSuccess();

      setEmailInput("");
      setNewsletterOptIn(true);
      setIssueText("");
      setShowSuccessModal(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to submit issue.");
    } finally {
      setIsSubmittingLocal(false);
    }
  }

  return (
    <>
      <div className="mt-4 rounded-2xl border border-[#d8cabc] bg-white p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-zinc-900">Report issue</p>
          <p className="text-sm text-zinc-600">
            Tell us what looks wrong and we’ll review it.
          </p>
        </div>

        <input
          type="email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(sanitizeEmailInput(e.target.value));
            onError("");
          }}
          placeholder="Email"
          disabled={isBusy}
          className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none disabled:opacity-60"
        />

        <textarea
          value={issueText}
          onChange={(e) => {
            setIssueText(sanitizeIssueText(e.target.value));
            onError("");
          }}
          placeholder="What is the issue?"
          rows={5}
          disabled={isBusy}
          className="mt-3 w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none disabled:opacity-60"
        />

        <p className="mt-2 text-xs text-zinc-500">
          We’ll use this email to follow up if needed.
        </p>

        <label className="mt-3 flex items-start gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            disabled={isBusy}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 disabled:opacity-60"
          />
          <span>I want to be added to the newsletter.</span>
        </label>

        {emailInput.trim().length > 0 && !isValidEmail(emailInput) && (
          <p className="mt-3 text-sm text-red-600">Please enter a valid email.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy || !isValidEmail(emailInput) || !issueText.trim()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "Submitting..." : "Submit issue"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isBusy) return;
              setEmailInput("");
              setNewsletterOptIn(true);
              setIssueText("");
              onError("");
              onCancel();
            }}
            disabled={isBusy}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close success modal"
            onClick={() => setShowSuccessModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="relative z-[121] w-full max-w-md rounded-[28px] border border-[#d8cabc] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-7">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <span className="text-2xl leading-none">×</span>
            </button>

            <p className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              Issue submitted
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Your issue has been reported
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Thanks for flagging this. We’ll review the report.
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}