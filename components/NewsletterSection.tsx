"use client";

import { useEffect, useState } from "react";

function sanitizeEmailInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._%+-@]/g, "");
}

function isValidEmail(email: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
}

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    const cleanedEmail = sanitizeEmailInput(email);

    if (!cleanedEmail || !isValidEmail(cleanedEmail)) {
      setMessage("Enter a valid email.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      setEmail("");
      setShowSuccessModal(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section
        id="newsletter"
        className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="rounded-[28px] border border-[#d8cabc] bg-white p-6 sm:p-8">
          <p className="text-sm text-zinc-500">Newsletter</p>

          <div className="mt-2 max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Get updates when new opportunities are added.
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
              Join for occasional updates on new internships, scholarships,
              programs, events, and other opportunities for NYC high school
              students.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(sanitizeEmailInput(e.target.value));
                setMessage("");
              }}
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-[#d8cabc] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-zinc-400"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isValidEmail(email)}
              className="rounded-2xl bg-zinc-900 px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Joining..." : "Join newsletter"}
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm text-red-600">
              {message}
            </p>
          )}
        </div>
      </section>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close newsletter success modal"
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
              Newsletter
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Your email has been added
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              You’re on the list for future updates from Teen Opportunities.
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