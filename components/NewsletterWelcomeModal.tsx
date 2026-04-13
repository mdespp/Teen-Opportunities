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

    window.setTimeout(() => {
      const opportunitiesSection = document.getElementById("opportunities");
      if (opportunitiesSection) {
        opportunitiesSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 120);
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
              className="relative z-[101] max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-black/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:rounded-[28px]"
            >
              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="order-2 px-4 py-4 sm:px-8 sm:py-8 lg:order-1">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400 sm:text-sm">
                        Teen Opportunities
                      </p>

                      <h2 className="mt-2 max-w-2xl text-[1.9rem] font-semibold leading-[0.95] tracking-tight text-zinc-950 sm:mt-3 sm:text-5xl">
                        <span className="sm:hidden">Find opportunities faster.</span>
                        <span className="hidden sm:inline">
                          A cleaner way to find opportunities for high school students.
                        </span>
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 sm:inline-flex"
                    >
                      <span className="text-2xl leading-none">×</span>
                    </button>
                  </div>

                  <p className="mt-4 max-w-2xl text-[14px] leading-6 text-zinc-600 sm:mt-6 sm:text-lg sm:leading-7">
                    <span className="sm:hidden">
                      Browse opportunities for high school students.
                    </span>
                    <span className="hidden sm:inline">
                      Internships, scholarships, pre-college, contests,
                      volunteering, jobs, student-run events, and startup
                      opportunities — all meant for high school students.
                    </span>
                  </p>

                  <div className="mt-5 hidden gap-2.5 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-3">
                    <div className="rounded-[18px] border border-zinc-200 bg-zinc-50 px-3.5 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 sm:text-xs sm:tracking-[0.16em]">
                        Focused
                      </p>
                      <p className="mt-1.5 text-[13px] leading-5 text-zinc-700 sm:mt-2 sm:text-sm sm:leading-6">
                        Built around opportunities that are actually useful for
                        students.
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-zinc-200 bg-zinc-50 px-3.5 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 sm:text-xs sm:tracking-[0.16em]">
                        Open
                      </p>
                      <p className="mt-1.5 text-[13px] leading-5 text-zinc-700 sm:mt-2 sm:text-sm sm:leading-6">
                        Anyone can submit a program, event, or startup for
                        review.
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-zinc-200 bg-zinc-50 px-3.5 py-3 sm:rounded-2xl sm:px-4 sm:py-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 sm:text-xs sm:tracking-[0.16em]">
                        Student-friendly
                      </p>
                      <p className="mt-1.5 text-[13px] leading-5 text-zinc-700 sm:mt-2 sm:text-sm sm:leading-6">
                        Students can submit too, as long as it is truly for high
                        school students.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
                    <button
                      type="button"
                      onClick={handleBrowse}
                      className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3.5"
                    >
                      Browse opportunities
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToSubmit}
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3.5"
                    >
                      Submit an opportunity
                    </button>
                  </div>
                </div>

                <div className="order-1 border-b border-zinc-200 bg-[#f7f4f1] px-4 py-4 sm:px-8 sm:py-8 lg:order-2 lg:border-b-0 lg:border-l">
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 sm:text-sm sm:tracking-[0.16em]">
                            Newsletter
                          </p>
                          <h3 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-zinc-950 sm:mt-3 sm:text-2xl">
                            Stay in the loop
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 sm:hidden"
                        >
                          <span className="text-2xl leading-none">×</span>
                        </button>
                      </div>

                      <p className="mt-2 text-[13px] leading-5 text-zinc-600 sm:mt-3 sm:text-sm sm:leading-6">
                        Get updates when new opportunities are added.
                      </p>

                      <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(sanitizeEmailInput(e.target.value));
                            setMessage("");
                          }}
                          placeholder="Enter your email"
                          className="w-full rounded-xl border border-[#d8cabc] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-zinc-400 sm:rounded-2xl sm:px-4 sm:py-3.5"
                        />

                        <p className="text-[11px] leading-4 text-zinc-500 sm:text-xs">
                          This form is intended for users age 13 or older.
                        </p>

                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting || !isValidEmail(email)}
                          className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-5 sm:py-3.5"
                        >
                          {isSubmitting ? "Joining..." : "Join newsletter"}
                        </button>

                        {message && (
                          <p className="text-sm text-red-600">{message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 hidden border-t border-zinc-200 pt-4 sm:mt-8 sm:block sm:pt-5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400 sm:text-xs sm:tracking-[0.16em]">
                        Included here
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
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
                            className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700 sm:px-3 sm:py-1.5 sm:text-xs"
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-3 sm:px-4">
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
              className="relative z-[121] w-full max-w-md rounded-[24px] border border-[#d8cabc] bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:rounded-[28px] sm:p-7"
            >
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 sm:right-4 sm:top-4 sm:h-9 sm:w-9"
              >
                <span className="text-2xl leading-none">×</span>
              </button>

              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 sm:text-sm">
                Newsletter
              </p>

              <h3 className="mt-2.5 text-xl font-semibold tracking-tight text-zinc-900 sm:mt-3 sm:text-2xl">
                Your email has been added
              </h3>

              <p className="mt-2.5 text-sm leading-6 text-zinc-600 sm:mt-3">
                You’re on the list for future updates from Teen Opportunities.
              </p>

              <div className="mt-4 sm:mt-5">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 sm:rounded-2xl sm:px-5 sm:py-3"
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