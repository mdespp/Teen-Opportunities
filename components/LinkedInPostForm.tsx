"use client";

import { useEffect, useMemo, useState } from "react";
import { parseLinkedInProfileUrl } from "@/lib/linkedin";
import {
  containsBlockedNameTerm,
  isBlockedLinkedInSubmission,
  sanitizeEditableName,
} from "@/lib/nameModeration";
import { isValidEmail, sanitizeEmailInput } from "@/lib/email";

type LinkedInPostFormProps = {
  opportunityId: string | number;
  isSaving: boolean;
  onSuccess: (connectedUsers: any[], postedEmail: string) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

export default function LinkedInPostForm({
  opportunityId,
  isSaving,
  onSuccess,
  onError,
  onCancel,
}: LinkedInPostFormProps) {
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");
  const [editedName, setEditedName] = useState("");
  const [hasEditedName, setHasEditedName] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const parsedLinkedIn = useMemo(
    () => parseLinkedInProfileUrl(linkedinUrlInput),
    [linkedinUrlInput]
  );

  const displayName =
    hasEditedName || !parsedLinkedIn.isValid ? editedName : parsedLinkedIn.name;

  useEffect(() => {
    if (!hasEditedName) {
      setEditedName(
        parsedLinkedIn.isValid ? sanitizeEditableName(parsedLinkedIn.name) : ""
      );
    }
  }, [parsedLinkedIn, hasEditedName]);

  useEffect(() => {
    if (!showCodeModal) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowCodeModal(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showCodeModal]);

  useEffect(() => {
    console.log("LinkedIn checkbox state changed:", newsletterOptIn);
  }, [newsletterOptIn]);

  async function handlePostLinkedIn() {
    const cleanedDisplayName = sanitizeEditableName(displayName);
    const guessedName = sanitizeEditableName(parsedLinkedIn.name);
    const cleanedEmail = sanitizeEmailInput(emailInput);

    setSuccessMessage("");
    setDeleteCode("");
    setCopied(false);

    if (!cleanedDisplayName.trim()) {
      onError("Please enter a valid name.");
      return;
    }

    if (containsBlockedNameTerm(cleanedDisplayName)) {
      onError("That name cannot be used.");
      return;
    }

    if (!cleanedEmail) {
      onError("Please enter an email.");
      return;
    }

    if (!isValidEmail(cleanedEmail)) {
      onError("Please enter a valid email.");
      return;
    }

    if (
      parsedLinkedIn.isValid &&
      isBlockedLinkedInSubmission({
        submittedName: cleanedDisplayName,
        guessedName,
        slug: parsedLinkedIn.slug,
      })
    ) {
      onError("That name cannot be used.");
      return;
    }

    try {
      console.log("Posting LinkedIn with newsletterOptIn:", newsletterOptIn);
      console.log("Posting LinkedIn payload:", {
        linkedinUrl: linkedinUrlInput,
        name: cleanedDisplayName,
        email: cleanedEmail,
        newsletterOptIn,
      });

      const response = await fetch(`/api/opportunities/${opportunityId}/linkedin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkedinUrl: linkedinUrlInput,
          name: cleanedDisplayName,
          email: cleanedEmail,
          newsletterOptIn,
        }),
      });

      const data = await response.json();

      console.log("LinkedIn post response status:", response.status);
      console.log("LinkedIn post response data:", data);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to post LinkedIn.");
      }

      onSuccess(
        Array.isArray(data.connectedUsers) ? data.connectedUsers : [],
        data.postedEmail || cleanedEmail
      );

      setSuccessMessage(
        data?.message ||
          "Your LinkedIn was posted. Save your delete code somewhere safe."
      );
      setDeleteCode(String(data?.deleteCode || ""));
      setShowCodeModal(Boolean(data?.deleteCode));

      setLinkedinUrlInput("");
      setEditedName("");
      setHasEditedName(false);
      setEmailInput("");
      setNewsletterOptIn(false);
      onError("");
    } catch (error) {
      console.error("LinkedIn post failed:", error);
      onError(error instanceof Error ? error.message : "Failed to post LinkedIn.");
    }
  }

  async function handleCopyCode() {
    if (!deleteCode) return;

    try {
      await navigator.clipboard.writeText(deleteCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="mt-4 rounded-2xl border border-[#d8cabc] bg-white p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-zinc-900">Post LinkedIn</p>
          <p className="text-sm text-zinc-600">
            Paste a LinkedIn profile link. The name will be guessed automatically,
            and you can edit it.
          </p>
        </div>

        <input
          type="text"
          value={linkedinUrlInput}
          onChange={(e) => {
            setLinkedinUrlInput(e.target.value);
            if (!hasEditedName) {
              setEditedName("");
            }
            onError("");
          }}
          placeholder="https://linkedin.com/in/..."
          className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
        />

        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            setEditedName(sanitizeEditableName(e.target.value));
            setHasEditedName(true);
            onError("");
          }}
          placeholder="Name"
          className="mt-3 w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
        />

        <input
          type="email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(sanitizeEmailInput(e.target.value));
            onError("");
          }}
          placeholder="Email"
          className="mt-3 w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
        />

        <p className="mt-2 text-xs text-zinc-500">
          Letters, spaces, and hyphens only for the name. Max 33 characters.
        </p>

        <p className="mt-2 text-xs leading-5 text-zinc-500">
          This email will be saved with your post. Your delete code will appear
          right after posting and will only be shown once.
        </p>

        <label className="mt-3 flex items-start gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => {
              console.log("Checkbox clicked, next value:", e.target.checked);
              setNewsletterOptIn(e.target.checked);
            }}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300"
          />
          <span>I want to be added to the newsletter.</span>
        </label>

        {parsedLinkedIn.isValid && parsedLinkedIn.name && !hasEditedName && (
          <p className="mt-3 text-sm text-zinc-600">
            Guessed name:{" "}
            <span className="font-medium text-zinc-800">
              {sanitizeEditableName(parsedLinkedIn.name)}
            </span>
          </p>
        )}

        {emailInput.trim().length > 0 && !isValidEmail(emailInput) && (
          <p className="mt-3 text-sm text-red-600">Please enter a valid email.</p>
        )}

        {!parsedLinkedIn.isValid && linkedinUrlInput.trim().length > 0 && (
          <p className="mt-3 text-sm text-red-600">
            Please enter a valid LinkedIn profile URL.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePostLinkedIn}
            disabled={
              isSaving ||
              !parsedLinkedIn.isValid ||
              !displayName.trim() ||
              !isValidEmail(emailInput)
            }
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Posting..." : "Post LinkedIn"}
          </button>

          <button
            type="button"
            onClick={() => {
              setLinkedinUrlInput("");
              setEditedName("");
              setHasEditedName(false);
              setEmailInput("");
              setNewsletterOptIn(false);
              setSuccessMessage("");
              setDeleteCode("");
              setCopied(false);
              setShowCodeModal(false);
              onCancel();
            }}
            disabled={isSaving}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>

      {showCodeModal && deleteCode && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close delete code modal"
            onClick={() => setShowCodeModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="relative z-[121] w-full max-w-lg rounded-[28px] border border-[#d8cabc] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-7">
            <button
              type="button"
              onClick={() => setShowCodeModal(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <span className="text-2xl leading-none">×</span>
            </button>

            <p className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              LinkedIn posted
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Save your delete code
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              This code will only be shown once. You will need it if you want to
              remove your LinkedIn submission later.
            </p>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                Delete code
              </p>
              <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-[0.18em] text-zinc-900">
                {deleteCode}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {copied ? "Copied" : "Copy code"}
              </button>

              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                I saved it
              </button>
            </div>

            {successMessage && (
              <p className="mt-4 text-sm text-emerald-700">{successMessage}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}