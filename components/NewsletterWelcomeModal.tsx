"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type NewsletterWelcomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

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

export default function NewsletterWelcomeModal({
  isOpen,
  onClose,
}: NewsletterWelcomeModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showSuccessModal) {
          setShowSuccessModal(false);
          return;
        }
        onClose();
      }
    }

    if (isOpen || showSuccessModal) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, showSuccessModal]);

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

  function handleBrowse() {
    onClose();
  }

  function handleGoToSubmit() {
    onClose();

    window.setTimeout(() => {
      const submitSection = document.getElementById("submit");
      if (submitSection) {
        submitSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 120);
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
            <motion.button
              type="button"
              aria-label="Close modal backdrop"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[101] max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-black/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
            >
              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="px-5 py-5 sm:px-8 sm:py-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 sm:text-sm">
                        Teen Opportunities
                      </p>
                      <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight text-zinc-950 sm:text-5xl">
                        A cleaner way to find opportunities for high school students.
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <span className="text-2xl leading-none">×</span>
                    </button>
                  </div>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:mt-6 sm:text-lg">
                    Internships, scholarships, pre-college, contests,
                    volunteering, jobs, student-run events, and startup
                    opportunities — all meant for high school students.
                  </p>

                  <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                        Focused
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">
                        Built around opportunities that are actually useful for
                        students.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                        Open
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">
                        Anyone can submit a program, event, or startup for
                        review.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                        Student-friendly
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">
                        Students can submit too, as long as it is truly for high
                        school students.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleBrowse}
                      className="w-full rounded-2xl bg-zinc-950 px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
                    >
                      Browse opportunities
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToSubmit}
                      className="w-full rounded-2xl border border-zinc-300 px-5 py-3.5 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:w-auto"
                    >
                      Submit an opportunity
                    </button>
                  </div>
                </div>

                <div className="border-t border-zinc-200 bg-[#f7f4f1] px-5 py-5 sm:px-8 sm:py-8 lg:border-l lg:border-t-0">
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400 sm:text-sm">
                        Newsletter
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                        Stay in the loop
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-600">
                        Get updates when new opportunities are added.
                      </p>

                      <div className="mt-6 space-y-3">
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

                        <p className="text-xs text-zinc-500">
                          This form is intended for users age 13 or older.
                        </p>

                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting || !isValidEmail(email)}
                          className="w-full rounded-2xl bg-zinc-950 px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Joining..." : "Join newsletter"}
                        </button>

                        {message && (
                          <p className="text-sm text-red-600">{message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 border-t border-zinc-200 pt-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                        Included here
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "Internships",
                          "Scholarships",
                          "Pre-College",
                          "Volunteering",
                          "Contests",
                          "Student Events",
                          "Startups",
                        ].map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
            <motion.button
              type="button"
              aria-label="Close newsletter success modal"
              onClick={() => setShowSuccessModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[121] w-full max-w-md rounded-[28px] border border-[#d8cabc] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-7"
            >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}