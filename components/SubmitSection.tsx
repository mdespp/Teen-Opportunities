"use client";

import { useState } from "react";
import SubmitOpportunityFormModal from "@/components/SubmitOpportunityFormModal";

export default function SubmitSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section
        id="submit"
        className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="rounded-[28px] border border-[#d8cabc] bg-white p-6 sm:p-8">
          <p className="text-sm text-zinc-500">Contribute</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Submit an opportunity
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
            Found an opportunity that should be on the site? Submit it for
            review.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Open submission form
            </button>
          </div>
        </div>
      </section>

      <SubmitOpportunityFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}